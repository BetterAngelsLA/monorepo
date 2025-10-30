import { Link } from 'react-router-dom';
export default function CreateShelterForm() {
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Handle form submission logic here
    console.log('Shelter created!');
  }

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent";
  const textareaClass = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-vertical";
  const sectionClass = "bg-white border border-gray-200 rounded-lg p-6 mb-6";
  const headingClass = "text-xl font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200";

  return (
    <div>
      <Link to="/operator/dashboard">
        <button>Back to Dashboard</button>
      </Link>
      <h1>Create New Shelter</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <section className={sectionClass}>
          <h2 className={headingClass}>Basic Information</h2>
          <div className="space-y-3">
            <input type="text" placeholder="Name" required className={inputClass} />
            <input type="text" placeholder="Organization" className={inputClass} />
            <input type="text" placeholder="Location" className={inputClass} />
            <input type="email" placeholder="Email" className={inputClass} />
            <input type="tel" placeholder="Phone" className={inputClass} />
            <input type="url" placeholder="Website" className={inputClass} />
            <input type="text" placeholder="Instagram" className={inputClass} />
            <input type="text" placeholder="Operating Hours" className={inputClass} />
          </div>
        </section>

        {/* Summary Information */}
        <section className={sectionClass}>
          <h2 className={headingClass}>Summary Information</h2>
          <div className="space-y-3">
            <input type="text" placeholder="Demographics" className={inputClass} />
            <input type="text" placeholder="Special Situation" className={inputClass} />
            <input type="text" placeholder="Shelter Types" className={inputClass} />
            <textarea placeholder="Description" rows={4} className={textareaClass} />
          </div>
        </section>

        {/* Sleeping Arrangements */}
        <section className={sectionClass}>
          <h2 className={headingClass}>Sleeping Arrangements</h2>
          <div className="space-y-3">
            <input type="number" placeholder="Total Beds" className={inputClass} />
            <input type="text" placeholder="Room Styles" className={inputClass} />
            <textarea placeholder="Additional Notes" rows={3} className={textareaClass} />
          </div>
        </section>

        {/* Shelter Features */}
        <section className={sectionClass}>
          <h2 className={headingClass}>Shelter Features</h2>
          <div className="space-y-3">
            <input type="text" placeholder="Accessibility" className={inputClass} />
            <input type="text" placeholder="Storage" className={inputClass} />
            <input type="text" placeholder="Pets" className={inputClass} />
            <input type="text" placeholder="Parking" className={inputClass} />
            <textarea placeholder="Additional Notes" rows={3} className={textareaClass} />
          </div>
        </section>

        {/* Policies & Rules */}
        <section className={sectionClass}>
          <h2 className={headingClass}>Policies & Rules</h2>
          <div className="space-y-3">
            <input type="number" placeholder="Maximum Stay (days)" className={inputClass} />
            <input type="text" placeholder="Intake Hours" className={inputClass} />
            <input type="text" placeholder="Curfew" className={inputClass} />
            <input type="text" placeholder="On-Site Security" className={inputClass} />
            <input type="text" placeholder="Visitors Allowed" className={inputClass} />
            <input type="text" placeholder="Exit Policy" className={inputClass} />
            <input type="text" placeholder="Emergency Capacity Surge Options" className={inputClass} />
            <textarea placeholder="Other Rules" rows={3} className={textareaClass} />
          </div>
        </section>

        {/* Services Offered */}
        <section className={sectionClass}>
          <h2 className={headingClass}>Services Offered</h2>
          <div className="space-y-3">
            <input type="text" placeholder="Immediate Needs" className={inputClass} />
            <input type="text" placeholder="General Services" className={inputClass} />
            <input type="text" placeholder="Health Services" className={inputClass} />
            <input type="text" placeholder="Training Services" className={inputClass} />
            <input type="text" placeholder="Meal Services" className={inputClass} />
            <textarea placeholder="Additional Notes" rows={3} className={textareaClass} />
          </div>
        </section>

        {/* Entry Requirements */}
        <section className={sectionClass}>
          <h2 className={headingClass}>Entry Requirements</h2>
          <div className="space-y-3">
            <input type="text" placeholder="Entry Requirements" className={inputClass} />
            <input type="text" placeholder="Referral Requirement" className={inputClass} />
            <input type="text" placeholder="Bed Fees" className={inputClass} />
            <input type="text" placeholder="Program Fees" className={inputClass} />
            <textarea placeholder="Entry Information" rows={3} className={textareaClass} />
          </div>
        </section>

        {/* Ecosystem Information */}
        <section className={sectionClass}>
          <h2 className={headingClass}>Ecosystem Information</h2>
          <div className="space-y-3">
            <input type="text" placeholder="Cities" className={inputClass} />
            <input type="text" placeholder="SPA (Service Planning Area)" className={inputClass} />
            <input type="text" placeholder="LA City Council District" className={inputClass} />
            <input type="text" placeholder="Supervisorial District" className={inputClass} />
            <input type="text" placeholder="Shelter Programs" className={inputClass} />
            <input type="text" placeholder="Funders" className={inputClass} />
          </div>
        </section>

        {/* Better Angels Review */}
        <section className={sectionClass}>
          <h2 className={headingClass}>Better Angels Review</h2>
          <div className="space-y-3">
            <input type="number" placeholder="Overall Rating" min="0" max="5" step="0.1" className={inputClass} />
            <textarea placeholder="Subjective Review" rows={4} className={textareaClass} />
          </div>
        </section>

        <button
          type="submit"
          className="w-full bg-white border-2 border-gray-900 text-gray-900 font-semibold py-3 px-6 rounded-md hover:bg-gray-100 transition-colors"
        >
          Create Shelter
        </button>
      </form>
    </div>
  );
}
