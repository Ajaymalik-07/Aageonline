import React from 'react';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}

export const Table: React.FC<TableProps> = ({ children, className = '', style, ...props }) => {
  return (
    <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left',
          fontSize: 'var(--font-size-sm)',
          ...style,
        }}
        className={`aage-table ${className}`.trim()}
        {...props}
      >
        {children}
      </table>
    </div>
  );
};

export const TableHead: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  style,
  ...props
}) => (
  <thead
    style={{
      backgroundColor: 'var(--surface-soft)',
      borderBottom: '1px solid var(--border-subtle)',
      ...style,
    }}
    {...props}
  >
    {children}
  </thead>
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  style,
  ...props
}) => <tbody style={{ ...style }} {...props}>{children}</tbody>;

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  children,
  style,
  ...props
}) => (
  <tr
    style={{
      borderBottom: '1px solid var(--border-subtle)',
      transition: 'background-color var(--motion-fast)',
      ...style,
    }}
    {...props}
  >
    {children}
  </tr>
);

export const TableHeaderCell: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  children,
  style,
  ...props
}) => (
  <th
    style={{
      padding: 'var(--space-3) var(--space-4)',
      fontWeight: 700,
      fontSize: 'var(--font-size-xs)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: 'var(--text-secondary)',
      ...style,
    }}
    {...props}
  >
    {children}
  </th>
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  children,
  style,
  ...props
}) => (
  <td
    style={{
      padding: 'var(--space-4)',
      color: 'var(--text-primary)',
      verticalAlign: 'middle',
      ...style,
    }}
    {...props}
  >
    {children}
  </td>
);
