import type { SVGProps } from "react";

export function GameSphereLogo(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <title>GameSphere Logo</title>
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z" />
            <path d="M12 12H8" />
            <path d="M16 12h-4" />
            <path d="M12 12v4" />
            <path d="M12 8v4" />
            <path d="M15 9h-2a1 1 0 0 0-1 1v0a1 1 0 0 0 1 1h2a1 1 0 0 1 1 1v0a1 1 0 0 1-1 1h-2" />
        </svg>
    );
}
