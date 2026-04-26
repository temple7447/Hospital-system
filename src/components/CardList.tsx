import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

interface CardListProps<T> {
  items: T[];
  keyField: keyof T;
  renderItem: (item: T, index: number) => React.ReactNode;
  emptyMessage?: string;
  className?: string;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export function CardList<T>({ 
  items, 
  keyField, 
  renderItem, 
  emptyMessage = 'No items found',
  className 
}: CardListProps<T>) {
  return (
    <div className={cn("space-y-4", className)}>
      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400 font-medium">{emptyMessage}</p>
        </div>
      ) : (
        items.map((item, index) => (
          <motion.div key={String(item[keyField])} variants={itemVariants}>
            {renderItem(item, index)}
          </motion.div>
        ))
      )}
    </div>
  );
}

export default CardList;