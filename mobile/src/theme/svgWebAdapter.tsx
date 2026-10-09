import React from 'react';

// Web SVG adapter for Vite dev preview to prevent codegenNativeComponent crash
export const Svg = (props: any) => <svg {...props} />;
export const Path = (props: any) => <path {...props} />;
export const Line = (props: any) => <line {...props} />;
export const Circle = (props: any) => <circle {...props} />;
export const Polyline = (props: any) => <polyline {...props} />;
export const Polygon = (props: any) => <polygon {...props} />;
export const Rect = (props: any) => <rect {...props} />;
export const G = (props: any) => <g {...props} />;
export const Text = (props: any) => <text {...props} />;
export const Defs = (props: any) => <defs {...props} />;
export const LinearGradient = (props: any) => <linearGradient {...props} />;
export const Stop = (props: any) => <stop {...props} />;

export default Svg;
