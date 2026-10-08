import React from 'react';
import { DbStatus } from '../types';
import { Leaf, HardDrive, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

interface DbStatusBadgeProps {
  status: DbStatus | null;
  loading: boolean;
  onRefresh: () => void;
}

export const DbStatusBadge: React.FC<DbStatusBadgeProps> = ({ status, loading, onRefresh }) => {
  if (loading) {
    return (
      <div className="badge badge-sqlite">
        <Leaf className="w-3.5 h-3.5 loading-spinner" />
        Checking DB...
      </div>
    );
  }

  if (!status) {
    return (
      <div className="badge" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
        <AlertTriangle className="w-3.5 h-3.5" />
        DB Disconnected
      </div>
    );
  }

  const isMysql = status.active_db === 'mysql' || status.mysql_connected;

  return (
    <div 
      className={`badge ${isMysql ? 'badge-mysql' : 'badge-sqlite'}`} 
      title={`Active Storage: ${status.active_db.toUpperCase()} | ${status.history_count} Predictions Saved | ${status.species_count} Species Metadata`}
      onClick={onRefresh}
      style={{ cursor: 'pointer' }}
    >
      {isMysql ? <Leaf className="w-3.5 h-3.5" /> : <HardDrive className="w-3.5 h-3.5" />}
      <span>{isMysql ? 'MySQL Workbench DB' : 'SQLite Fallback DB'}</span>
      <span style={{ opacity: 0.6, fontSize: '0.7rem' }}>({status.history_count} saved)</span>
    </div>
  );
};
