import React from "react";

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

export const Card = ({ children, className = "", onClick }: CardProps) => {
    return (
        <div
            onClick={onClick}
            className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-200 ${onClick ? "cursor-pointer hover:shadow-md active:scale-[0.98]" : ""
                } ${className}`}
        >
            {children}
        </div>
    );
};

export const CardHeader = ({ children, className = "" }: CardProps) => (
    <div className={`p-5 pb-0 ${className}`}>{children}</div>
);

export const CardBody = ({ children, className = "" }: CardProps) => (
    <div className={`p-5 ${className}`}>{children}</div>
);

export const CardFooter = ({ children, className = "" }: CardProps) => (
    <div className={`p-5 pt-0 ${className}`}>{children}</div>
);
