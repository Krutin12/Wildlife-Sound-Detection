"""
Phase 8: Model Development
============================
EfficientNet-B3 with Transfer Learning for animal sound classification.

Architecture:
    - Pretrained EfficientNet-B3 backbone (via timm)
    - Custom classification head with dropout
    - Support for freezing/unfreezing backbone layers

Usage:
    from src.phase08_model import BirdCLEFModel
    model = BirdCLEFModel(num_classes=200)
    model.freeze_backbone()
    model.unfreeze_layers(n=3)
"""

import os
import sys

import torch
import torch.nn as nn

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config


class BirdCLEFModel(nn.Module):
    """
    EfficientNet-B3 model for animal sound classification.
    
    Uses a pretrained backbone with a custom classification head.
    Supports gradual unfreezing for fine-tuning.
    
    Args:
        num_classes: Number of output classes (species).
        dropout_rate: Dropout probability for the classifier head.
        pretrained: Whether to use pretrained ImageNet weights.
    """

    def __init__(self, num_classes, dropout_rate=None, pretrained=None):
        super().__init__()

        self.num_classes = num_classes
        self.dropout_rate = dropout_rate or config.DROPOUT_RATE
        self.pretrained = pretrained if pretrained is not None else config.PRETRAINED

        # Load pretrained EfficientNet-B3 via timm
        import timm
        self.backbone = timm.create_model(
            config.MODEL_NAME,
            pretrained=self.pretrained,
            num_classes=0,  # Remove default classifier
        )

        # Enable gradient checkpointing to save ~60% activation VRAM during training
        if hasattr(self.backbone, "set_grad_checkpointing"):
            try:
                self.backbone.set_grad_checkpointing(True)
            except Exception:
                pass

        # Get the number of features from backbone
        self.num_features = self.backbone.num_features

        # Custom classification head
        self.classifier = nn.Sequential(
            nn.BatchNorm1d(self.num_features),
            nn.Dropout(self.dropout_rate),
            nn.Linear(self.num_features, 512),
            nn.ReLU(inplace=True),
            nn.BatchNorm1d(512),
            nn.Dropout(self.dropout_rate * 0.5),
            nn.Linear(512, num_classes),
        )

        # Initialize classifier weights
        self._init_classifier()

    def _init_classifier(self):
        """Initialize classifier head weights with Kaiming initialization."""
        for m in self.classifier.modules():
            if isinstance(m, nn.Linear):
                nn.init.kaiming_normal_(m.weight, mode="fan_out", nonlinearity="relu")
                if m.bias is not None:
                    nn.init.constant_(m.bias, 0)
            elif isinstance(m, nn.BatchNorm1d):
                nn.init.constant_(m.weight, 1)
                nn.init.constant_(m.bias, 0)

    def forward(self, x):
        """
        Forward pass.
        
        Args:
            x: Input tensor of shape (batch, 3, n_mels, time_steps).
        
        Returns:
            torch.Tensor: Logits of shape (batch, num_classes).
        """
        features = self.backbone(x)
        logits = self.classifier(features)
        return logits

    def freeze_backbone(self):
        """Freeze all backbone layers (for training only the classifier head)."""
        for param in self.backbone.parameters():
            param.requires_grad = False

    def unfreeze_backbone(self):
        """Unfreeze all backbone layers (for full fine-tuning)."""
        for param in self.backbone.parameters():
            param.requires_grad = True

    def unfreeze_layers(self, n=3):
        """
        Gradually unfreeze the last n blocks of the backbone.
        
        This enables fine-tuning deeper layers while keeping early
        feature extraction layers frozen.
        
        Args:
            n: Number of blocks to unfreeze from the end.
        """
        # First freeze everything
        self.freeze_backbone()

        # Get all named children of the backbone
        children = list(self.backbone.named_children())
        
        # Unfreeze the last n children/blocks
        for name, child in children[-n:]:
            for param in child.parameters():
                param.requires_grad = True

    def get_parameter_groups(self, lr_head=None, lr_backbone=None):
        """
        Create parameter groups with differential learning rates.
        
        The classifier head gets a higher learning rate, while the
        backbone gets a lower learning rate for fine-tuning.
        
        Args:
            lr_head: Learning rate for the classifier head.
            lr_backbone: Learning rate for the backbone.
        
        Returns:
            list: Parameter groups for the optimizer.
        """
        lr_head = lr_head or config.LEARNING_RATE_HEAD
        lr_backbone = lr_backbone or config.LEARNING_RATE_FINETUNE

        backbone_params = [p for p in self.backbone.parameters() if p.requires_grad]
        head_params = list(self.classifier.parameters())

        param_groups = []
        if backbone_params:
            param_groups.append({"params": backbone_params, "lr": lr_backbone})
        param_groups.append({"params": head_params, "lr": lr_head})

        return param_groups


def build_model(num_classes, device=None):
    """
    Build and prepare the BirdCLEF model.
    
    Args:
        num_classes: Number of species classes.
        device: Target device (default from config).
    
    Returns:
        BirdCLEFModel: Model moved to the specified device.
    """
    device = device or config.DEVICE

    model = BirdCLEFModel(num_classes=num_classes)
    model = model.to(device)

    return model
