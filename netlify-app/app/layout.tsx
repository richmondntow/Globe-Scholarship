import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'GlobeScholarship AI — Explore your possibilities',description:'Explore international scholarship opportunities on an interactive globe. Search, compare, and save your next opportunity in your personal workspace.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
