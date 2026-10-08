"""
Phase 15: Animal Information Database
=======================================
SQLite database containing detailed information about each species:
- Primary Label, Common Name, Scientific Name
- Animal Class, Habitat, Diet
- Geographic Distribution, Conservation Status
- Interesting Facts

Populated from taxonomy.csv and supplementary data.

Usage:
    from src.phase15_database import AnimalDatabase
    db = AnimalDatabase()
    db.build_from_taxonomy()
    info = db.get_info("barswa")
"""

import json
import os
import sqlite3
import sys

import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config
from src.utils import setup_logging, print_separator


class AnimalDatabase:
    """
    SQLite database for animal species information.
    
    Stores and retrieves detailed ecological information for
    each species in the BirdCLEF 2026 dataset.
    """

    def __init__(self, db_path=None):
        self.db_path = db_path or config.DATABASE_PATH
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self.conn = sqlite3.connect(self.db_path)
        self.conn.row_factory = sqlite3.Row
        self._create_table()

    def _create_table(self):
        """Create the animal_info table if it doesn't exist."""
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS animal_info (
                primary_label TEXT PRIMARY KEY,
                common_name TEXT,
                scientific_name TEXT,
                animal_class TEXT,
                habitat TEXT,
                diet TEXT,
                geographic_distribution TEXT,
                conservation_status TEXT,
                interesting_facts TEXT
            )
        """)
        self.conn.commit()

    def build_from_taxonomy(self, taxonomy_path=None, train_csv_path=None, logger=None):
        """
        Build the database from taxonomy.csv and train.csv.
        
        Extracts available information from the dataset files and
        populates the database with reasonable defaults for missing fields.
        
        Args:
            taxonomy_path: Path to taxonomy.csv.
            train_csv_path: Path to train.csv (for primary labels).
            logger: Logger instance.
        """
        logger = logger or setup_logging()
        taxonomy_path = taxonomy_path or config.TAXONOMY_CSV
        train_csv_path = train_csv_path or config.TRAIN_CSV

        print_separator("BUILDING ANIMAL INFO DATABASE")

        # Load taxonomy
        taxonomy_df = pd.read_csv(taxonomy_path)
        logger.info(f"Loaded taxonomy with {len(taxonomy_df)} entries")
        logger.info(f"Taxonomy columns: {list(taxonomy_df.columns)}")

        # Load train for primary labels
        train_df = pd.read_csv(train_csv_path)
        all_labels = train_df["primary_label"].unique()

        # Detect column mappings from taxonomy
        col_map = self._detect_columns(taxonomy_df)
        logger.info(f"Detected column mapping: {col_map}")

        # Build entries
        count = 0
        for label in all_labels:
            entry = self._build_entry(label, taxonomy_df, col_map)
            self._upsert(entry)
            count += 1

        self.conn.commit()
        logger.info(f"Populated database with {count} species entries")
        logger.info(f"Database saved to: {self.db_path}")

    def _detect_columns(self, taxonomy_df):
        """
        Auto-detect column names in taxonomy.csv for mapping.
        
        Returns:
            dict: Mapping of standard field names to actual column names.
        """
        columns = {c.lower(): c for c in taxonomy_df.columns}
        col_map = {}

        # Primary label
        for candidate in ["primary_label", "species_code", "label", "ebird_code", "code"]:
            if candidate in columns:
                col_map["primary_label"] = columns[candidate]
                break

        # Common name
        for candidate in ["common_name", "english_name", "name", "en"]:
            if candidate in columns:
                col_map["common_name"] = columns[candidate]
                break

        # Scientific name
        for candidate in ["scientific_name", "sci_name", "species", "latin_name"]:
            if candidate in columns:
                col_map["scientific_name"] = columns[candidate]
                break

        # Class
        for candidate in ["class", "class_name", "animal_class", "taxon_class"]:
            if candidate in columns:
                col_map["class"] = columns[candidate]
                break

        # Order
        for candidate in ["order", "order_name"]:
            if candidate in columns:
                col_map["order"] = columns[candidate]
                break

        # Family
        for candidate in ["family", "family_name"]:
            if candidate in columns:
                col_map["family"] = columns[candidate]
                break

        return col_map

    def _build_entry(self, label, taxonomy_df, col_map):
        """
        Build a database entry for a given species label.
        
        Args:
            label: Primary label string.
            taxonomy_df: Taxonomy dataframe.
            col_map: Column mapping dict.
        
        Returns:
            dict: Entry data.
        """
        entry = {
            "primary_label": label,
            "common_name": label,
            "scientific_name": "Unknown",
            "animal_class": "Unknown",
            "habitat": "Various habitats",
            "diet": "Varies by species",
            "geographic_distribution": "See range maps",
            "conservation_status": "Not assessed",
            "interesting_facts": "A fascinating species in the BirdCLEF 2026 dataset.",
        }

        # Try to find in taxonomy
        label_col = col_map.get("primary_label")
        if label_col and label_col in taxonomy_df.columns:
            match = taxonomy_df[taxonomy_df[label_col] == label]
            if len(match) > 0:
                row = match.iloc[0]

                if "common_name" in col_map and col_map["common_name"] in row.index:
                    val = row[col_map["common_name"]]
                    if pd.notna(val):
                        entry["common_name"] = str(val)

                if "scientific_name" in col_map and col_map["scientific_name"] in row.index:
                    val = row[col_map["scientific_name"]]
                    if pd.notna(val):
                        entry["scientific_name"] = str(val)

                if "class" in col_map and col_map["class"] in row.index:
                    val = row[col_map["class"]]
                    if pd.notna(val):
                        entry["animal_class"] = str(val)

                # Infer class from order if not directly available
                if entry["animal_class"] == "Unknown" and "order" in col_map:
                    if col_map["order"] in row.index:
                        order_val = row[col_map["order"]]
                        if pd.notna(order_val):
                            entry["animal_class"] = self._infer_class_from_order(str(order_val))

        return entry

    def _infer_class_from_order(self, order):
        """Infer animal class from taxonomic order."""
        bird_orders = [
            "Passeriformes", "Accipitriformes", "Anseriformes", "Apodiformes",
            "Caprimulgiformes", "Charadriiformes", "Ciconiiformes", "Columbiformes",
            "Coraciiformes", "Cuculiformes", "Falconiformes", "Galliformes",
            "Gruiformes", "Pelecaniformes", "Piciformes", "Psittaciformes",
            "Strigiformes", "Suliformes", "Tinamiformes", "Trogoniformes",
        ]
        mammal_orders = [
            "Chiroptera", "Rodentia", "Primates", "Carnivora", "Cetartiodactyla",
        ]
        amphibian_orders = ["Anura", "Caudata", "Gymnophiona"]
        reptile_orders = ["Squamata", "Testudines", "Crocodylia"]
        insect_orders = [
            "Orthoptera", "Hemiptera", "Coleoptera", "Lepidoptera", "Hymenoptera",
        ]

        if order in bird_orders:
            return "Aves (Bird)"
        elif order in mammal_orders:
            return "Mammalia (Mammal)"
        elif order in amphibian_orders:
            return "Amphibia (Amphibian)"
        elif order in reptile_orders:
            return "Reptilia (Reptile)"
        elif order in insect_orders:
            return "Insecta (Insect)"
        else:
            return f"Unknown (Order: {order})"

    def _upsert(self, entry):
        """Insert or update a database entry."""
        self.conn.execute("""
            INSERT OR REPLACE INTO animal_info 
            (primary_label, common_name, scientific_name, animal_class,
             habitat, diet, geographic_distribution, conservation_status, interesting_facts)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            entry["primary_label"],
            entry["common_name"],
            entry["scientific_name"],
            entry["animal_class"],
            entry["habitat"],
            entry["diet"],
            entry["geographic_distribution"],
            entry["conservation_status"],
            entry["interesting_facts"],
        ))

    def get_info(self, primary_label):
        """
        Retrieve information for a species.
        
        Args:
            primary_label: Species primary label.
        
        Returns:
            dict: Species information or None if not found.
        """
        cursor = self.conn.execute(
            "SELECT * FROM animal_info WHERE primary_label = ?", (primary_label,)
        )
        row = cursor.fetchone()
        if row:
            return dict(row)
        return None

    def get_all_species(self):
        """Get all species in the database."""
        cursor = self.conn.execute("SELECT primary_label, common_name FROM animal_info")
        return [dict(row) for row in cursor.fetchall()]

    def close(self):
        """Close the database connection."""
        self.conn.close()

    def __del__(self):
        try:
            self.conn.close()
        except Exception:
            pass
