export default function Hero() {
  return (
    <section className="text-center px-4 py-16">
      <div className="flex justify-center gap-8 mb-10">
        <img src="/sign1.png" alt="Sign1" className="w-16 h-16" />
        <img src="/sign2.png" alt="Sign2" className="w-16 h-16" />
        <img src="/sign3.png" alt="Sign3" className="w-16 h-16" />
        <img src="/sign4.png" alt="Sign4" className="w-16 h-16" />
      </div>
      <h2 className="text-3xl md:text-4xl font-semibold mb-6">
        Making Communication <br />
        Easier With Technology
      </h2>
      <p className="max-w-xl mx-auto text-sm text-gray-200 leading-relaxed">
        Utilizing machine learning and artificial intelligence to allow easier understanding of online resources be it videos or audio. 
        With an extension that can be accessed with any browser, users will be able to view real-life translation with ease.
      </p>
    </section>
  );
}
