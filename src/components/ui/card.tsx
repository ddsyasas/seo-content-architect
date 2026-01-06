import { type ReactNode } from 'react';
import { cn } from '@/lib/utils/helpers';

export interface CardProps {
    children: ReactNode;
    className?: string;
    hover?: boolean;
    onClick?: () => void;
}

export function Card({ children, className, hover = false, onClick }: CardProps) {
    return (
        <div
            className={cn(
                'rounded-xl border border-gray-200 bg-white shadow-sm',
                hover && 'transition-all duration-200 hover:shadow-md hover:border-gray-300 cursor-pointer',
                className
            )}
            onClick={onClick}
        >
            {children}
        </div>
    );
}

export interface CardHeaderProps {
    children: ReactNode;
    className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
    return (
        <div className={cn('px-6 py-4 border-b border-gray-200', className)}>
            {children}
        </div>
    );
}

export interface CardContentProps {
    children: ReactNode;
    className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
    return <div className={cn('px-6 py-4', className)}>{children}</div>;
}

export interface CardFooterProps {
    children: ReactNode;
    className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
    return (
        <div className={cn('px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl', className)}>
            {children}
        </div>
    );
}
