import { useEffect, useRef, useState } from 'react';

const EMPTY_SIZE = { width: 0, height: 0 };

export const useElementSize = () => {
    const elementRef = useRef(null);
    const [size, setSize] = useState(EMPTY_SIZE);

    useEffect(() => {
        const node = elementRef.current;
        if (!node) {
            return undefined;
        }

        const updateSize = () => {
            setSize({
                width: node.clientWidth,
                height: node.clientHeight
            });
        };

        updateSize();

        const observer = new ResizeObserver(() => {
            updateSize();
        });

        observer.observe(node);
        window.addEventListener('resize', updateSize);

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', updateSize);
        };
    }, []);

    return { elementRef, size, isReady: size.width > 0 && size.height > 0 };
};
