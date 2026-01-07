import { motion, MotionProps } from 'framer-motion';
import type {
  FC,
  ButtonHTMLAttributes,
  DetailedHTMLProps,
  ReactNode,
} from 'react';

/* -----------------------------------------------------------
   Props: normal button HTML props + optional children
   ----------------------------------------------------------- */
export type ButtonProps = DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> &
  MotionProps & {
    children?: ReactNode;
  };

/* -----------------------------------------------------------
   Default button – white fill, 4 px black border, lift on hover
   ----------------------------------------------------------- */
export const Button: FC<ButtonProps> = ({
  children,
  disabled,
  className = '',
  style,
  ...rest // includes onClick, whileHover, etc.
}) => {
  const defaultStyle: React.CSSProperties = {
    background: 'white',
    border: '4px solid black',
    cursor: disabled ? 'default' : 'pointer',
    padding: '0.5rem 1rem',
    fontWeight: 600,
    fontSize: '1rem',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    /* no shadow by default – added on hover via motion */
  };

  return (
    <motion.button
      disabled={disabled}
      className={className}
      style={{ ...defaultStyle, ...style }}
      whileHover={{
        y: -4,
        boxShadow: '0px 8px 12px rgba(0,0,0,0.2)',
      }}
      {...rest}
    >
      {children}
    </motion.button>
  );
};

/* Export both default and named */
export default Button;
