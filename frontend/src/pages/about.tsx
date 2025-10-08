import { NextPage } from 'next';

const AboutPage: NextPage = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-slate-900 mb-4">About AlzAware</h1>
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold text-slate-700">Our Mission</h2>
          <p className="text-slate-600 leading-relaxed">
            Our mission is to provide accessible and reliable tools for early detection of Alzheimer's disease. We believe that early diagnosis is crucial for effective management and treatment of the disease. Our platform empowers individuals and healthcare professionals with cutting-edge technology to make informed decisions about cognitive health.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold text-slate-700">Our Technology</h2>
          <p className="text-slate-600 leading-relaxed">
            AlzAware leverages state-of-the-art machine learning models to analyze MRI scans and cognitive test results. Our proprietary algorithms are trained on vast datasets to identify subtle patterns and biomarkers associated with Alzheimer's disease. We are committed to continuous research and development to improve the accuracy and reliability of our diagnostic tools.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold text-slate-700">Disclaimer</h2>
          <p className="text-slate-600 leading-relaxed">
            AlzAware is intended for informational and educational purposes only, and does not constitute medical advice. The information provided by our platform should not be used for self-diagnosis or as a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
          </p>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
