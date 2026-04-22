
// @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Instrument+Sans:wght@400;500;600;700&display=swap');

// /* ---------- Base ---------- */
// .homepage-root {
//   font-family: 'Instrument Sans', sans-serif;
//   background: #FAFAF7;
//   overflow-x: hidden;
//   color: #1A1F1C;
// }

// /* ---------- Reveal Animations ---------- */
// .reveal {
//   opacity: 0;
//   transform: translateY(32px);
//   transition: opacity .7s ease, transform .7s ease;
// }

// .reveal.visible {
//   opacity: 1;
//   transform: translateY(0);
// }

// .reveal-left {
//   opacity: 0;
//   transform: translateX(-32px);
//   transition: opacity .7s ease, transform .7s ease;
// }

// .reveal-left.visible {
//   opacity: 1;
//   transform: translateX(0);
// }

// .reveal-right {
//   opacity: 0;
//   transform: translateX(32px);
//   transition: opacity .7s ease, transform .7s ease;
// }

// .reveal-right.visible {
//   opacity: 1;
//   transform: translateX(0);
// }

// /* ---------- Delays ---------- */
// .delay-1 { transition-delay: .1s !important; }
// .delay-2 { transition-delay: .2s !important; }
// .delay-3 { transition-delay: .3s !important; }
// .delay-4 { transition-delay: .4s !important; }
// .delay-5 { transition-delay: .5s !important; }

// /* ---------- Buttons / Cards Hover ---------- */
// .cat-chip {
//   transition: all .25s cubic-bezier(0.34,1.56,0.64,1);
//   cursor: pointer;
// }

// .cat-chip:hover {
//   transform: translateY(-3px);
// }

// .biz-card-wrap {
//   transition: all .3s cubic-bezier(0.34,1.56,0.64,1);
// }

// .biz-card-wrap:hover {
//   transform: translateY(-6px);
// }

// .review-card {
//   transition: all .25s ease;
// }

// .review-card:hover {
//   transform: translateY(-3px);
//   box-shadow: 0 12px 40px rgba(26,31,28,0.10);
// }

// /* ---------- Floating CTA ---------- */
// .ai-float {
//   animation: float 3s ease-in-out infinite;
// }

// /* ---------- Hero Dot ---------- */
// .hero-dot {
//   animation: pulse-dot 2s ease-in-out infinite;
// }

// /* ---------- Marquee ---------- */
// .marquee-track {
//   display: inline-flex;
//   gap: 48px;
//   animation: marquee 20s linear infinite;
// }

// /* ---------- Scrollbar ---------- */
// .no-scrollbar::-webkit-scrollbar {
//   display: none;
// }

// .no-scrollbar {
//   scrollbar-width: none;
// }

// /* ---------- Search Placeholder ---------- */
// .search-input::placeholder {
//   color: rgba(26,31,28,0.4);
// }

// /* ---------- Loading Skeleton ---------- */
// .shimmer-load {
//   background: linear-gradient(
//     90deg,
//     #e8e3d8 25%,
//     #f0ece3 50%,
//     #e8e3d8 75%
//   );
//   background-size: 200% 100%;
//   animation: shimmer-load 1.5s infinite;
// }

// /* ---------- Hero Blob Shapes ---------- */
// .hero-blob-1 {
//   animation: blob1 8s ease-in-out infinite;
// }

// .hero-blob-2 {
//   animation: blob2 10s ease-in-out infinite;
// }

// .hero-blob-3 {
//   animation: blob3 12s ease-in-out infinite;
// }

// /* ---------- Floating Cards ---------- */
// .card-float-1 { animation: card-float-1 4s ease-in-out infinite; }
// .card-float-2 { animation: card-float-2 4.5s ease-in-out infinite; }
// .card-float-3 { animation: card-float-3 5s ease-in-out infinite; }
// .card-float-4 { animation: card-float-4 3.8s ease-in-out infinite; }
// .card-float-5 { animation: card-float-5 4.2s ease-in-out infinite; }

// /* ---------- Keyframes ---------- */
// @keyframes float {
//   0%,100% { transform: translateY(0); }
//   50% { transform: translateY(-8px); }
// }

// @keyframes pulse-dot {
//   0%,100% { opacity: 1; transform: scale(1); }
//   50% { opacity: .6; transform: scale(.8); }
// }

// @keyframes marquee {
//   from { transform: translateX(0); }
//   to   { transform: translateX(-50%); }
// }

// @keyframes shimmer-load {
//   0%   { background-position: 200% 0; }
//   100% { background-position: -200% 0; }
// }

// @keyframes blob1 {
//   0%,100% { transform: translate(0,0) scale(1); }
//   33% { transform: translate(60px,-40px) scale(1.1); }
//   66% { transform: translate(-40px,30px) scale(.95); }
// }

// @keyframes blob2 {
//   0%,100% { transform: translate(0,0) scale(1); }
//   33% { transform: translate(-50px,50px) scale(1.08); }
//   66% { transform: translate(40px,-30px) scale(.97); }
// }

// @keyframes blob3 {
//   0%,100% { transform: translate(0,0) scale(1); }
//   33% { transform: translate(30px,60px) scale(1.05); }
//   66% { transform: translate(-60px,-20px) scale(1.02); }
// }

// @keyframes card-float-1 {
//   0%,100% { transform: translateY(0) rotate(-4deg); }
//   50% { transform: translateY(-12px) rotate(-4deg); }
// }

// @keyframes card-float-2 {
//   0%,100% { transform: translateY(0) rotate(3deg); }
//   50% { transform: translateY(-10px) rotate(3deg); }
// }

// @keyframes card-float-3 {
//   0%,100% { transform: translateY(0) rotate(-2deg); }
//   50% { transform: translateY(-14px) rotate(-2deg); }
// }

// @keyframes card-float-4 {
//   0%,100% { transform: translateY(0) rotate(5deg); }
//   50% { transform: translateY(-8px) rotate(5deg); }
// }

// @keyframes card-float-5 {
//   0%,100% { transform: translateY(0) rotate(-6deg); }
//   50% { transform: translateY(-11px) rotate(-6deg); }
// }

// .section-title {
//   font-family: 'Cormorant Garamond', serif;
//   font-weight: 600;
//   line-height: 1.1;
//   letter-spacing: -0.5px;
//   color: #1A1F1C;
// }

// .section-title-light {
//   font-family: 'Cormorant Garamond', serif;
//   font-weight: 600;
//   line-height: 1.1;
//   color: white;
// }


// .page-section {
//   padding: 80px clamp(32px, 6vw, 96px);
// }

// @media (max-width: 768px) {
//   .page-section {
//     padding: 56px 24px;
//   }
// }