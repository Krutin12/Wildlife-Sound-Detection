import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/app_theme.dart';
import '../../models/history_model.dart';
import '../../providers/history_provider.dart';
import '../../widgets/empty_state.dart';

/// Full Prediction History with Search, Delete, Clear All, and Centered Modal (1:1 with Web App).
class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  final _searchCtrl = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<HistoryProvider>().fetchHistory();
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _confirmClearAll() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Clear All Prediction History'),
        content: const Text(
          'This will permanently delete all bioacoustic prediction logs from the database. Continue?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.rose),
            child: const Text('Clear All Logs'),
          ),
        ],
      ),
    );
    if (confirmed == true && mounted) {
      await context.read<HistoryProvider>().clearAll();
    }
  }

  void _showDetailModal(HistoryItem item) {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (context) {
        final isDark = Theme.of(context).brightness == Brightness.dark;
        final confPct = (item.confidence * 100).toStringAsFixed(1);
        final commonName = item.commonName.isNotEmpty ? item.commonName : item.predictedLabel;

        return Dialog(
          backgroundColor: Colors.transparent,
          insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          child: Container(
            width: double.infinity,
            constraints: const BoxConstraints(maxWidth: 540, maxHeight: 680),
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: isDark ? AppTheme.cardDark : AppTheme.cardWhite,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(
                color: isDark ? AppTheme.borderDark : AppTheme.cardBorder,
                width: 1.2,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: isDark ? 0.4 : 0.12),
                  blurRadius: 28,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Top Row: Record ID + Close X Button
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: isDark ? AppTheme.mintBg.withValues(alpha: 0.2) : AppTheme.mintBg,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppTheme.mintBorder),
                        ),
                        child: Text(
                          'Record #${item.id}',
                          style: const TextStyle(
                            fontSize: 10.5,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.green,
                          ),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded, size: 20),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),

                  const SizedBox(height: 10),

                  // Species Common & Scientific Name + Confidence Pill
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              commonName,
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                            if (item.scientificName.isNotEmpty)
                              Text(
                                item.scientificName,
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontStyle: FontStyle.italic,
                                  color: AppTheme.forest,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: AppTheme.mintBg,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppTheme.mintBorder),
                        ),
                        child: Text(
                          '$confPct% Confidence',
                          style: const TextStyle(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.green,
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Metadata Matrix Box
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF142419) : const Color(0xFFF7FAF8),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppTheme.cardBorder),
                    ),
                    child: Column(
                      children: [
                        _buildModalRow('Taxon Class', item.animalClass.isNotEmpty ? item.animalClass : 'Aves', Icons.category_rounded, isDark),
                        const Divider(height: 14),
                        _buildModalRow('Audio File', (item.filename != null && item.filename!.isNotEmpty) ? item.filename! : 'audio_sample.wav', Icons.audio_file_rounded, isDark),
                        const Divider(height: 14),
                        _buildModalRow('Timestamp', item.createdAt ?? 'Recent', Icons.access_time_rounded, isDark),
                        if (item.habitat.isNotEmpty && item.habitat != 'N/A') ...[
                          const Divider(height: 14),
                          _buildModalRow('Habitat', item.habitat, Icons.forest_rounded, isDark),
                        ],
                        if (item.diet.isNotEmpty && item.diet != 'N/A') ...[
                          const Divider(height: 14),
                          _buildModalRow('Diet', item.diet, Icons.restaurant_rounded, isDark),
                        ],
                        if (item.distribution.isNotEmpty && item.distribution != 'N/A') ...[
                          const Divider(height: 14),
                          _buildModalRow('Distribution', item.distribution, Icons.map_rounded, isDark),
                        ],
                      ],
                    ),
                  ),

                  // Ecological Insights / Factsheet Box
                  if (item.interestingFacts.isNotEmpty && item.interestingFacts != 'N/A') ...[
                    const SizedBox(height: 14),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: isDark ? AppTheme.forestDark.withValues(alpha: 0.25) : AppTheme.mintBg,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppTheme.mintBorder),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.auto_awesome_rounded, size: 13, color: AppTheme.green),
                              SizedBox(width: 5),
                              Text(
                                'AI ECOLOGICAL INSIGHTS',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  color: AppTheme.green,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            item.interestingFacts,
                            style: const TextStyle(fontSize: 11.5, height: 1.45),
                          ),
                        ],
                      ),
                    ),
                  ],

                  const SizedBox(height: 20),

                  // Close Details CTA Button
                  SizedBox(
                    width: double.infinity,
                    height: 46,
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(context),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.forest,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Close Details', style: TextStyle(fontWeight: FontWeight.w800)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildModalRow(String label, String value, IconData icon, bool isDark) {
    return Row(
      children: [
        Icon(icon, size: 15, color: AppTheme.forest),
        const SizedBox(width: 8),
        Text(
          '$label: ',
          style: TextStyle(
            fontSize: 11.5,
            fontWeight: FontWeight.w600,
            color: isDark ? AppTheme.textLightSecondary : AppTheme.textSecondary,
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              color: isDark ? Colors.white : AppTheme.textDark,
            ),
            textAlign: TextAlign.end,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppTheme.bgDark : AppTheme.bgCanvas,
      body: SafeArea(
        bottom: false,
        child: Consumer<HistoryProvider>(
          builder: (context, provider, _) {
            final filteredItems = provider.items.where((item) {
              final q = _searchQuery.toLowerCase();
              return item.commonName.toLowerCase().contains(q) ||
                  item.scientificName.toLowerCase().contains(q) ||
                  item.predictedLabel.toLowerCase().contains(q) ||
                  (item.filename ?? '').toLowerCase().contains(q);
            }).toList();

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Header Row
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Prediction History',
                              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: -0.5,
                                  ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            const Text(
                              'Persistent Bioacoustic Classification Logs',
                              style: TextStyle(
                                fontSize: 12,
                                color: AppTheme.textSecondary,
                                fontWeight: FontWeight.w600,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            icon: const Icon(Icons.refresh_rounded, color: AppTheme.forest),
                            tooltip: 'Refresh logs',
                            onPressed: () => provider.fetchHistory(),
                          ),
                          if (provider.items.isNotEmpty)
                            IconButton(
                              icon: Container(
                                padding: const EdgeInsets.all(7),
                                decoration: BoxDecoration(
                                  color: AppTheme.rose.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: const Icon(
                                  Icons.delete_outline_rounded,
                                  color: AppTheme.rose,
                                  size: 18,
                                ),
                              ),
                              tooltip: 'Clear all records',
                              onPressed: _confirmClearAll,
                            ),
                        ],
                      ),
                    ],
                  ),
                ),

                // Search Input Field
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 6),
                  child: TextField(
                    controller: _searchCtrl,
                    onChanged: (q) => setState(() => _searchQuery = q),
                    decoration: InputDecoration(
                      hintText: 'Search by species, scientific name or audio filename...',
                      prefixIcon: const Icon(Icons.search_rounded),
                      suffixIcon: _searchCtrl.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear_rounded),
                              onPressed: () {
                                _searchCtrl.clear();
                                setState(() => _searchQuery = '');
                              },
                            )
                          : null,
                    ),
                  ),
                ),

                const SizedBox(height: 6),

                // Main Logs List
                Expanded(
                  child: _buildBody(provider, filteredItems, isDark),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildBody(HistoryProvider provider, List<HistoryItem> items, bool isDark) {
    if (provider.isLoading) {
      return const Center(child: CircularProgressIndicator(color: AppTheme.forest));
    }

    if (provider.errorMessage != null) {
      return EmptyState(
        icon: Icons.error_outline_rounded,
        title: 'Error Loading History',
        message: provider.errorMessage,
        action: ElevatedButton(
          onPressed: () => provider.fetchHistory(),
          child: const Text('Retry'),
        ),
      );
    }

    if (items.isEmpty) {
      return const EmptyState(
        icon: Icons.history_rounded,
        title: 'No Saved Logs Found',
        message: 'Perform wildlife audio classifications to store persistent records.',
      );
    }

    return RefreshIndicator(
      color: AppTheme.forest,
      onRefresh: () => provider.fetchHistory(),
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 6, 16, 24),
        itemCount: items.length,
        itemBuilder: (context, index) {
          final item = items[index];
          final confidence = (item.confidence * 100).toStringAsFixed(1);

          return Dismissible(
            key: ValueKey(item.id),
            direction: DismissDirection.endToStart,
            background: Container(
              alignment: Alignment.centerRight,
              padding: const EdgeInsets.only(right: 20),
              margin: const EdgeInsets.only(bottom: 10),
              decoration: BoxDecoration(
                color: AppTheme.rose.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(18),
              ),
              child: const Icon(Icons.delete_rounded, color: AppTheme.rose),
            ),
            onDismissed: (_) => provider.deleteItem(item.id),
            child: Container(
              margin: const EdgeInsets.only(bottom: 10),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.cardDark : AppTheme.cardWhite,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: isDark ? AppTheme.borderDark : AppTheme.cardBorder,
                  width: 1.2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.02),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: ListTile(
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                leading: Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: isDark ? AppTheme.mintBg.withValues(alpha: 0.2) : AppTheme.mintBg,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.graphic_eq_rounded,
                    color: AppTheme.forest,
                    size: 20,
                  ),
                ),
                title: Text(
                  item.commonName.isNotEmpty ? item.commonName : item.predictedLabel,
                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                subtitle: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (item.scientificName.isNotEmpty)
                      Text(
                        item.scientificName,
                        style: const TextStyle(
                          fontStyle: FontStyle.italic,
                          fontSize: 11.5,
                          color: AppTheme.forest,
                        ),
                      ),
                    Text(
                      item.createdAt ?? 'Recent',
                      style: TextStyle(
                        color: isDark ? AppTheme.textLightHint : AppTheme.textMuted,
                        fontSize: 10.5,
                      ),
                    ),
                  ],
                ),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.mintBg,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.mintBorder),
                      ),
                      child: Text(
                        '$confidence%',
                        style: const TextStyle(
                          color: AppTheme.green,
                          fontWeight: FontWeight.w800,
                          fontSize: 11.5,
                        ),
                      ),
                    ),
                    const SizedBox(width: 4),
                    const Icon(Icons.chevron_right_rounded, size: 18),
                  ],
                ),
                onTap: () => _showDetailModal(item),
              ),
            ),
          );
        },
      ),
    );
  }
}
