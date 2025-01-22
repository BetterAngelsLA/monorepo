export default function ContactUs() {
  return (
    <div className="bg-steel-blue w-full flex flex-col items-center justify-center py-8 md:py-20 text-white px-10">
      <h3 className="text-2xl md:text-[40px] mb-4 font-bold text-center">
        Have questions or need additional help?
      </h3>
      <a
        className="py-4 md:py-6 w-full text-center max-w-96 border-2 border-white rounded-full md:text-xl font-bold"
        href="mailto:someone@ba.com"
      >
        Contact Us
      </a>
    </div>
  );
}
