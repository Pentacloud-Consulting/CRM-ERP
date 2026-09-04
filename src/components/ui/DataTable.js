'use client';
import { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, Filter, LayoutGrid, List, ArrowRight } from 'lucide-react';
import styles from './DataTable.module.css';

export default function DataTable({
  columns,
  data,
  onRowClick,
  searchable = true,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No records found',
  stickyHeader = true,
  maxHeight,
  filters,
  renderActions,
}) {
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [activeFilters, setActiveFilters] = useState({});
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

  const filtered = useMemo(() => {
    let result = [...data];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(row =>
        columns.some(col => {
          const val = col.accessor ? (typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor]) : '';
          return String(val || '').toLowerCase().includes(q);
        })
      );
    }

    // Active filters
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value && value !== '__all__') {
        result = result.filter(row => row[key] === value);
      }
    });

    // Sort
    if (sortCol) {
      const col = columns.find(c => c.key === sortCol);
      if (col) {
        result.sort((a, b) => {
          const aVal = typeof col.accessor === 'function' ? col.accessor(a) : a[col.accessor];
          const bVal = typeof col.accessor === 'function' ? col.accessor(b) : b[col.accessor];
          if (aVal == null) return 1;
          if (bVal == null) return -1;
          const cmp = typeof aVal === 'number' ? aVal - bVal : String(aVal).localeCompare(String(bVal));
          return sortDir === 'asc' ? cmp : -cmp;
        });
      }
    }

    return result;
  }, [data, search, sortCol, sortDir, columns, activeFilters]);

  const handleSort = (colKey) => {
    if (sortCol === colKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(colKey);
      setSortDir('asc');
    }
  };

  const actionsCol = useMemo(() => columns.find(c => c.key === 'actions'), [columns]);

  return (
    <div className={styles.container}>
      {(searchable || filters || renderActions) && (
        <div className={styles.toolbar}>
          {searchable && (
            <div className={styles.searchWrap}>
              <Search size={15} className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}
          {filters && (
            <div className={styles.filters}>
              {filters.map(f => (
                <select
                  key={f.key}
                  className={styles.filterSelect}
                  value={activeFilters[f.key] || '__all__'}
                  onChange={(e) => setActiveFilters(prev => ({ ...prev, [f.key]: e.target.value }))}
                >
                  <option value="__all__">{f.label}: All</option>
                  {f.options.map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              ))}
            </div>
          )}
          
          <div className={styles.toolbarRight}>
            <div className={styles.viewToggle}>
              <button
                type="button"
                className={`${styles.toggleBtn} ${viewMode === 'table' ? styles.toggleBtnActive : ''}`}
                onClick={() => setViewMode('table')}
                title="Table View"
              >
                <List size={14} /> Table
              </button>
              <button
                type="button"
                className={`${styles.toggleBtn} ${viewMode === 'cards' ? styles.toggleBtnActive : ''}`}
                onClick={() => setViewMode('cards')}
                title="Card View"
              >
                <LayoutGrid size={14} /> Cards
              </button>
            </div>
            {renderActions && <div className={styles.actions}>{renderActions()}</div>}
          </div>
        </div>
      )}

      {/* ══════ TABLE VIEW MODE ══════ */}
      {viewMode === 'table' ? (
        <>
          <div className={styles.scrollHint}>
            <span>Swipe table horizontally to see all fields</span> <ArrowRight size={12} />
          </div>
          <div className={styles.tableWrap} style={maxHeight ? { maxHeight } : undefined}>
            <table className={styles.table}>
              <thead className={stickyHeader ? styles.stickyHead : ''}>
                <tr>
                  {columns.map((col, idx) => (
                    <th
                      key={col.key}
                      className={`${styles.th} ${idx === 0 ? styles.firstTh : ''} ${col.sortable !== false ? styles.sortable : ''} ${col.align === 'right' ? styles.right : ''}`}
                      style={col.width ? { width: col.width } : undefined}
                      onClick={() => col.sortable !== false && handleSort(col.key)}
                    >
                      <span className={styles.thContent}>
                        {col.label}
                        {sortCol === col.key && (
                          <span className={styles.sortIndicator}>
                            {sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </span>
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className={styles.empty}>
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  filtered.map((row, i) => (
                    <tr
                      key={(row.id || row.lead_id || row.shipment_id || row.account_id || row.contact_id || row.opportunity_id || row.awb_id || row.booking_request_id || row.manifest_id || row.declaration_id || 'row') + '-' + i}
                      className={`${styles.row} ${onRowClick ? styles.clickable : ''}`}
                      onClick={() => onRowClick?.(row)}
                      style={{ animationDelay: `${Math.min(i * 20, 300)}ms` }}
                    >
                      {columns.map((col, idx) => (
                        <td
                          key={col.key}
                          className={`${styles.td} ${idx === 0 ? styles.firstTd : ''} ${col.align === 'right' ? styles.right : ''} ${col.mono ? styles.mono : ''}`}
                        >
                          {col.render ? col.render(row) : (typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor])}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* ══════ CARD VIEW MODE (100% RESPONSIVE MOBILE CARDS) ══════ */
        <div className={styles.cardsWrap}>
          {filtered.length === 0 ? (
            <div className={styles.emptyCard}>{emptyMessage}</div>
          ) : (
            filtered.map((row, i) => (
              <div
                key={(row.id || row.lead_id || row.shipment_id || row.account_id || row.contact_id || row.opportunity_id || row.awb_id || row.booking_request_id || row.manifest_id || row.declaration_id || 'row') + '-' + i}
                className={styles.mobileRecordCard}
                onClick={() => onRowClick?.(row)}
              >
                <div className={styles.mobileCardHeader}>
                  {columns[0] && (
                    <div className={styles.mobileCardPrimary}>
                      {columns[0].render ? columns[0].render(row) : (typeof columns[0].accessor === 'function' ? columns[0].accessor(row) : row[columns[0].accessor])}
                    </div>
                  )}
                  {columns[1] && (
                    <div className={styles.mobileCardStatus}>
                      {columns[1].render ? columns[1].render(row) : (typeof columns[1].accessor === 'function' ? columns[1].accessor(row) : row[columns[1].accessor])}
                    </div>
                  )}
                </div>

                <div className={styles.mobileCardGrid}>
                  {columns.slice(2).map(col => {
                    if (!col.label || col.key === 'actions') return null;
                    const value = col.render ? col.render(row) : (typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor]);
                    return (
                      <div key={col.key} className={styles.mobileCardCell}>
                        <span className={styles.mobileCellLabel}>{col.label}</span>
                        <div className={styles.mobileCellValue}>{value || '—'}</div>
                      </div>
                    );
                  })}
                </div>

                {actionsCol && actionsCol.render && (
                  <div className={styles.mobileCardActions} onClick={e => e.stopPropagation()}>
                    {actionsCol.render(row)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      <div className={styles.footer}>
        <span className={styles.count}>{filtered.length} of {data.length} records</span>
      </div>
    </div>
  );
}
