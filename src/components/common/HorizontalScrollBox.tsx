import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { Box, IconButton, Tooltip, type SxProps, type Theme } from '@mui/material';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface HorizontalScrollBoxProps {
  children: ReactNode;
  scrollStep?: number;
  sx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
  gap?: number | string;
  buttonSize?: number;
  autoHideControls?: boolean;
}

export function HorizontalScrollBox({
  children,
  scrollStep = 240,
  sx,
  contentSx,
  gap = 1,
  buttonSize = 28,
  autoHideControls = true
}: HorizontalScrollBoxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  const checkScrollState = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const isOverflowing = scrollWidth > clientWidth + 4;
    setHasOverflow(isOverflowing);

    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    checkScrollState();
    const el = containerRef.current;
    if (!el) return;

    // Listen to resize on container
    const resizeObserver = new ResizeObserver(() => {
      checkScrollState();
    });
    resizeObserver.observe(el);

    window.addEventListener('resize', checkScrollState);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', checkScrollState);
    };
  }, [checkScrollState, children]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = containerRef.current;
    if (!el) return;

    const delta = direction === 'left' ? -scrollStep : scrollStep;
    el.scrollBy({ left: delta, behavior: 'smooth' });
    setTimeout(checkScrollState, 300);
  };

  const showControls = !autoHideControls || hasOverflow;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        ...sx
      }}
    >
      {/* Prev Navigation Button */}
      {showControls && (
        <Tooltip title="Cuộn về trước (Prev)">
          <span>
            <IconButton
              size="small"
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              aria-label="Cuộn về trước"
              sx={{
                flexShrink: 0,
                width: buttonSize,
                height: buttonSize,
                minWidth: buttonSize,
                p: 0,
                mr: 0.75,
                borderRadius: '6px',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                color: 'text.primary',
                boxShadow: theme =>
                  theme.palette.mode === 'dark'
                    ? '0 2px 6px rgba(0, 0, 0, 0.4)'
                    : '0 1px 4px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.15s ease',
                visibility: canScrollLeft ? 'visible' : 'hidden',
                opacity: canScrollLeft ? 1 : 0,
                '&:hover': {
                  bgcolor: 'action.hover',
                  borderColor: 'primary.main',
                  transform: 'scale(1.06)'
                },
                '&:active': {
                  transform: 'scale(0.95)'
                }
              }}
            >
              <ChevronLeft size={buttonSize > 26 ? 16 : 14} />
            </IconButton>
          </span>
        </Tooltip>
      )}

      {/* Main Scrollable Viewport */}
      <Box
        ref={containerRef}
        onScroll={checkScrollState}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: gap,
          flex: 1,
          minWidth: 0,
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth',
          py: 0.25,
          ...contentSx
        }}
      >
        {children}
      </Box>

      {/* Next Navigation Button */}
      {showControls && (
        <Tooltip title="Cuộn tiếp theo (Next)">
          <span>
            <IconButton
              size="small"
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              aria-label="Cuộn tiếp theo"
              sx={{
                flexShrink: 0,
                width: buttonSize,
                height: buttonSize,
                minWidth: buttonSize,
                p: 0,
                ml: 0.75,
                borderRadius: '6px',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                color: 'text.primary',
                boxShadow: theme =>
                  theme.palette.mode === 'dark'
                    ? '0 2px 6px rgba(0, 0, 0, 0.4)'
                    : '0 1px 4px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.15s ease',
                visibility: canScrollRight ? 'visible' : 'hidden',
                opacity: canScrollRight ? 1 : 0,
                '&:hover': {
                  bgcolor: 'action.hover',
                  borderColor: 'primary.main',
                  transform: 'scale(1.06)'
                },
                '&:active': {
                  transform: 'scale(0.95)'
                }
              }}
            >
              <ChevronRight size={buttonSize > 26 ? 16 : 14} />
            </IconButton>
          </span>
        </Tooltip>
      )}
    </Box>
  );
}
