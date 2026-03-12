import { useEffect, useRef } from 'react';

/**
 * AnimatedCounter - Animates numbers counting up from 0 to target value
 * @param {number} value - Target value to count to
 * @param {number} duration - Animation duration in milliseconds (default: 1500)
 * @param {string} prefix - Optional prefix (e.g., "৳")
 * @param {string} suffix - Optional suffix (e.g., "kg")
 * @param {number} decimals - Number of decimal places (default: 2)
 */
const AnimatedCounter = ({ 
  value, 
  duration = 1500, 
  prefix = '', 
  suffix = '',
  decimals = 2 
}) => {
  const countRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    const element = countRef.current;
    if (!element) return;

    const target = parseFloat(value) || 0;
    const startTime = Date.now();
    const startValue = 0;

    const updateCount = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      
      // Easing function (ease-out cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (target - startValue) * easeOut;
      
      element.textContent = `${prefix}${currentValue.toFixed(decimals)}${suffix}`;

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(updateCount);
      } else {
        element.textContent = `${prefix}${target.toFixed(decimals)}${suffix}`;
      }
    };

    updateCount();

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [value, duration, prefix, suffix, decimals]);

  return <span ref={countRef} className="tabular-nums">0.00</span>;
};

export default AnimatedCounter;
