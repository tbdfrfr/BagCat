import { useEffect, useRef, useState, useCallback, useMemo } from 'react';

const throttle = (func, limit) => {
  let inThrottle = false;
  return (...args) => {
    if (inThrottle) return;
    func(...args);
    inThrottle = true;
    setTimeout(() => {
      inThrottle = false;
    }, limit);
  };
};

const defaultOptions = {
  color: '59, 130, 246',
  size: 150,
  blur: 20,
  opacity: 0.4,
  transition: 200,
};

function useConfinedGlow(options = {}) {
  const elementRef = useRef(null);
  const glowRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);
  const isAnimatingRef = useRef(false);

  const config = useMemo(() => ({ ...defaultOptions, ...options }), [options]);

  const glowStyle = useMemo(
    () => ({
      position: 'absolute',
      pointerEvents: 'none',
      zIndex: 10,
      width: `${config.size}px`,
      height: `${config.size}px`,
      background: `radial-gradient(circle, rgba(${config.color}, ${config.opacity}) 0%, rgba(${config.color}, ${config.opacity * 0.5}) 50%, transparent 70%)`,
      borderRadius: '50%',
      filter: `blur(${config.blur}px)`,
      transition: `opacity ${config.transition}ms ease-out`,
      willChange: 'transform, opacity',
      transform: 'translate3d(-50%, -50%, 0)',
    }),
    [config.size, config.color, config.opacity, config.blur, config.transition],
  );

  const updateGlowPos = useCallback(
    throttle((e) => {
      if (!elementRef.current || !glowRef.current || !isAnimatingRef.current) return;

      const rect = elementRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      glowRef.current.style.transform = `translate3d(${x - config.size / 2}px, ${y - config.size / 2}px, 0)`;
    }, 8),
    [config.size],
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
    isAnimatingRef.current = true;
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    isAnimatingRef.current = false;
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('mouseenter', handleMouseEnter, { passive: true });
    element.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    element.addEventListener('mousemove', updateGlowPos, { passive: true });

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('mousemove', updateGlowPos);
    };
  }, [handleMouseEnter, handleMouseLeave, updateGlowPos]);

  const glowElement = (
    <div
      ref={glowRef}
      style={{
        ...glowStyle,
        opacity: isHovering ? 1 : 0,
      }}
    />
  );

  return {
    elementRef,
    glowElement,
  };
}

export function GlowWrapper({
  children,
  className = '',
  glowOptions = {},
  as: Component = 'div',
  style = {},
  ...props
}) {
  const { elementRef, glowElement } = useConfinedGlow(glowOptions);

  const wrapperStyle = useMemo(
    () => ({
      position: 'relative',
      overflow: 'hidden',
      isolation: 'isolate',
      contain: 'layout style paint',
      ...style,
    }),
    [style],
  );

  return (
    <Component ref={elementRef} className={className} style={wrapperStyle} {...props}>
      {glowElement}
      {children}
    </Component>
  );
}
