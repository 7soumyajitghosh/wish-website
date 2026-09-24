export const Footer = () => {
  return (
    <footer className="relative bg-[#0d0408] py-12 px-6 flex flex-col items-center justify-center text-center overflow-hidden">
      {/* Subtle top border gradient */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#ffb3c1] to-transparent opacity-30" aria-hidden="true"></div>
      {/* Decorative ambient glow */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_50%_60%_at_50%_100%,rgba(216,27,70,0.1),transparent_70%)]"
      />

      {/* Small decorative heart */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-5 h-5 text-[#d81b46] mb-6 opacity-80 transition-transform duration-300 hover:scale-110 hover:opacity-100"
        aria-hidden="true"
      >
        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
      </svg>

      <div className="relative z-10 flex flex-col items-center space-y-4">
        <h3 className="text-xl md:text-2xl font-serif text-[#fff8eb] tracking-wide">
          A Journey of Love
        </h3>
        
        <p className="flex items-center space-x-2 text-sm text-[#fff8eb]/85">
          <span>Made with</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4 text-[#d81b46]"
            aria-hidden="true"
          >
            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
          </svg>
          <span>Love</span>
        </p>

        <p className="text-sm text-[#fff8eb]/85 mt-8">
          &copy; 2026 A Journey of Love. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
