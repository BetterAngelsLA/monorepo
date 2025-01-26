export default function ContactUs() {
  return (
    <div className="bg-steel-blue w-full flex flex-col items-center justify-center py-8 md:py-20 text-white px-10">
      <h2 className="text-2xl md:text-[40px] md:leading-[1.2] mb-4 md:mb-10 font-bold text-center">
        Have questions or need additional help?
      </h2>
      <a
        aria-label="send us an email"
        className="py-4 md:py-6 w-full text-center max-w-96 border-2 border-white rounded-full md:text-xl font-bold"
        href="mailto:wildfires@betterangels.la"
      >
        Contact Us
      </a>
    </div>
  );
}
