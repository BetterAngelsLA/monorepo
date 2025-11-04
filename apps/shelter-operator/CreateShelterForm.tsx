import { Link } from 'react-router-dom';
import { useState } from 'react';
import {
  ShelterFormData,
  DEMOGRAPHICS_OPTIONS,
  SPECIAL_SITUATION_OPTIONS,
  SHELTER_TYPES_OPTIONS,
  ROOM_STYLES_OPTIONS,
  ACCESSIBILITY_OPTIONS,
  STORAGE_OPTIONS,
  PETS_OPTIONS,
  PARKING_OPTIONS,
  BOOLEAN_OPTIONS,
  EXIT_POLICY_OPTIONS,
  IMMEDIATE_NEEDS_OPTIONS,
  GENERAL_SERVICES_OPTIONS,
  HEALTH_SERVICES_OPTIONS,
  TRAINING_SERVICES_OPTIONS,
  MEAL_SERVICES_OPTIONS,
  ENTRY_REQUIREMENTS_OPTIONS,
  REFERRAL_REQUIREMENT_OPTIONS,
  SPA_OPTIONS,
  CITY_COUNCIL_DISTRICT_OPTIONS,
  SUPERVISORIAL_DISTRICT_OPTIONS,
  SHELTER_PROGRAMS_OPTIONS,
  FUNDERS_OPTIONS,
  OVERALL_RATING_OPTIONS,
  STATUS_OPTIONS,
  LA_CITIES_OPTIONS,
} from './types';

export default function CreateShelterForm() {

  const [formData, setFormData] = useState({
        // Basic Information
    name: '',
    organization: '',
    location: '',
    email: '',
    phone: '',
    website: '',
    instagram: '',
    facebook: '',
    other_social_media: '',
    operating_hours: '',

    // Summary Information
    demographics: [],
    demographics_other: '',
    special_situation_restrictions: [],
    shelter_types: [],
    shelter_types_other: '',
    description: '',

    // Sleeping Details
    total_beds: 0,
    room_styles: [],
    room_styles_other: '',
    add_notes_sleeping_details: '',

    // Shelter Details
    accessibility: [],
    storage: [],
    pets: [],
    parking: [],
    add_notes_shelter_details: '',

    // Policies
    max_stay: 0,
    intake_hours: '',
    curfew: '',
    on_site_security: null,
    visitors_allowed: null,
    exit_policy: [],
    exit_policy_other: '',
    emergency_surge: null,
    other_rules: '',
    agreement_form: null,

    // Services Offered
    immediate_needs: [],
    general_services: [],
    health_services: [],
    training_services: [],
    meal_services: [],
    other_services: '',

    // Entry Requirements
    entry_requirements: [],
    referral_requirement: [],
    bed_fees: '',
    program_fees: '',
    entry_info: '',

    // Ecosystem Information
    cities: [],
    spa: [],
    city_council_district: null,
    supervisorial_district: null,
    shelter_programs: [],
    shelter_programs_other: '',
    funders: [],
    funders_other: '',

    // Better Angels Review
    overall_rating: null,
    subjective_review: '',

    // Better Angels Administration
    status: 'Draft',

    // Media
    hero_image: null,
    exterior_photos: [],
    interior_photos: [],
    videos: [],
  });
  // Handler for text inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handler for number inputs
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? 0 : parseInt(value, 10)
    }));
  };

  // Handler for multi-select checkboxes
  const handleMultiSelectChange = (field: keyof ShelterFormData, value: string) => {
    setFormData(prev => {
      const currentValues = prev[field] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];

      return {
        ...prev,
        [field]: newValues
      };
    });
  };

  // Handler for boolean/nullable fields
  const handleBooleanChange = (field: keyof ShelterFormData, value: boolean | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handler for nullable number fields
  const handleNullableNumberChange = (field: keyof ShelterFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value === '' ? null : parseInt(value, 10)
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Handle form submission logic here
    console.log('Shelter created!');
    // To confirm our inputs are working
    console.log('Form data:', formData);
    // TODO: Send to GraphQL mutation
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
            <input
              type="text"
              name="name"
              placeholder="Name"
              required
              value={formData.name}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              type="text"
              name="organization"
              placeholder="Organization"
              value={formData.organization}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              type="text"
              name="location"
              placeholder="Location"
              value={formData.location}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              type="tel"
              name="phone"
              placeholder="Phone"
              value={formData.phone}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              type="url"
              name="website"
              placeholder="Website"
              value={formData.website}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              type="text"
              name="instagram"
              placeholder="Instagram"
              value={formData.instagram}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              type="text"
              name="operatingHours"
              placeholder="Operating Hours"
              value={formData.operatingHours}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        </section>

        {/* Summary Information */}
        <section className={sectionClass}>
          <h2 className={headingClass}>Summary Information</h2>
          <div className="space-y-3">
            <input
              type="text"
              name="demographics"
              placeholder="Demographics"
              value={formData.demographics}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              type="text"
              name="specialSituation"
              placeholder="Special Situation"
              value={formData.specialSituation}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              type="text"
              name="shelterTypes"
              placeholder="Shelter Types"
              value={formData.shelterTypes}
              onChange={handleChange}
              className={inputClass}
            />
            <textarea
              name="description"
              placeholder="Description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className={textareaClass}
            />
          </div>
        </section>

        {/* Sleeping Arrangements */}
        <section className={sectionClass}>
          <h2 className={headingClass}>Sleeping Arrangements</h2>
          <div className="space-y-3">
            <input
              type="number"
              name="totalBeds"
              placeholder="Total Beds"
              value={formData.totalBeds}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              type="text"
              name="roomStyles"
              placeholder="Room Styles"
              value={formData.roomStyles}
              onChange={handleChange}
              className={inputClass}
            />
            <textarea
              name="sleepingNotes"
              placeholder="Additional Notes"
              rows={3}
              value={formData.sleepingNotes}
              onChange={handleChange}
              className={textareaClass}
            />
          </div>
        </section>

        {/* Shelter Features */}
        <section className={sectionClass}>
          <h2 className={headingClass}>Shelter Features</h2>
          <div className="space-y-3">
            <input
              type="text"
              name="accessibility"
              placeholder="Accessibility"
              value={formData.accessibility}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              type="text"
              name="storage"
              placeholder="Storage"
              value={formData.storage}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              type="text"
              name="pets"
              placeholder="Pets"
              value={formData.pets}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              type="text"
              name="parking"
              placeholder="Parking"
              value={formData.parking}
              onChange={handleChange}
              className={inputClass}
            />
            <textarea
              name="featuresNotes"
              placeholder="Additional Notes"
              rows={3}
              value={formData.featuresNotes}
              onChange={handleChange}
              className={textareaClass}
            />
          </div>
        </section>

        {/* Policies & Rules */}
        <section className={sectionClass}>
          <h2 className={headingClass}>Policies & Rules</h2>
          <div className="space-y-3">
            <input
              type="number"
              name="maxStay"
              placeholder="Maximum Stay (days)"
              value={formData.maxStay}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              type="text"
              name="intakeHours"
              placeholder="Intake Hours"
              value={formData.intakeHours}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              type="text"
              name="curfew"
              placeholder="Curfew"
              value={formData.curfew}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              type="text"
              name="onSiteSecurity"
              placeholder="On-Site Security"
              value={formData.onSiteSecurity}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              type="text"
              name="visitorsAllowed"
              placeholder="Visitors Allowed"
              value={formData.visitorsAllowed}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              type="text"
              name="exitPolicy"
              placeholder="Exit Policy"
              value={formData.exitPolicy}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              type="text"
              name="emergencyCapacity"
              placeholder="Emergency Capacity Surge Options"
              value={formData.emergencyCapacity}
              onChange={handleChange}
              className={inputClass}
            />
            <textarea
              name="otherRules"
              placeholder="Other Rules"
              rows={3}
              value={formData.otherRules}
              onChange={handleChange}
              className={textareaClass}
            />
          </div>
        </section>

        {/* Services Offered */}
        <section className={sectionClass}>
          <h2 className={headingClass}>Services Offered</h2>
          <div className="space-y-3">
            <input
              type="text"
              name="immediateNeeds"
              placeholder="Immediate Needs"
              value={formData.immediateNeeds}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              type="text"
              name="generalServices"
              placeholder="General Services"
              value={formData.generalServices}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              type="text"
              name="healthServices"
              placeholder="Health Services"
              value={formData.healthServices}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              type="text"
              name="trainingServices"
              placeholder="Training Services"
              value={formData.trainingServices}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              type="text"
              name="mealServices"
              placeholder="Meal Services"
              value={formData.mealServices}
              onChange={handleChange}
              className={inputClass}
            />
            <textarea
              name="servicesNotes"
              placeholder="Additional Notes"
              rows={3}
              value={formData.servicesNotes}
              onChange={handleChange}
              className={textareaClass}
            />
          </div>
        </section>

        {/* Entry Requirements */}
        <section className={sectionClass}>
          <h2 className={headingClass}>Entry Requirements</h2>
          <div className="space-y-3">
            <input
              type="text"
              name="entryRequirements"
              placeholder="Entry Requirements"
              value={formData.entryRequirements}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              type="text"
              name="referralRequirement"
              placeholder="Referral Requirement"
              value={formData.referralRequirement}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              type="text"
              name="bedFees"
              placeholder="Bed Fees"
              value={formData.bedFees}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              type="text"
              name="programFees"
              placeholder="Program Fees"
              value={formData.programFees}
              onChange={handleChange}
              className={inputClass}
            />
            <textarea
              name="entryInfo"
              placeholder="Entry Information"
              rows={3}
              value={formData.entryInfo}
              onChange={handleChange}
              className={textareaClass}
            />
          </div>
        </section>

        {/* Ecosystem Information */}
        <section className={sectionClass}>
          <h2 className={headingClass}>Ecosystem Information</h2>
          <div className="space-y-3">
            <input
              type="text"
              name="cities"
              placeholder="Cities"
              value={formData.cities}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              type="text"
              name="spa"
              placeholder="SPA (Service Planning Area)"
              value={formData.spa}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              type="text"
              name="laCityCouncilDistrict"
              placeholder="LA City Council District"
              value={formData.laCityCouncilDistrict}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              type="text"
              name="supervisorialDistrict"
              placeholder="Supervisorial District"
              value={formData.supervisorialDistrict}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              type="text"
              name="shelterPrograms"
              placeholder="Shelter Programs"
              value={formData.shelterPrograms}
              onChange={handleChange}
              className={inputClass}
            />
            <input
              type="text"
              name="funders"
              placeholder="Funders"
              value={formData.funders}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        </section>

        {/* Better Angels Review */}
        <section className={sectionClass}>
          <h2 className={headingClass}>Better Angels Review</h2>
          <div className="space-y-3">
            <input
              type="number"
              name="overallRating"
              placeholder="Overall Rating"
              min="0"
              max="5"
              step="0.1"
              value={formData.overallRating}
              onChange={handleChange}
              className={inputClass}
            />
            <textarea
              name="subjectiveReview"
              placeholder="Subjective Review"
              rows={4}
              value={formData.subjectiveReview}
              onChange={handleChange}
              className={textareaClass}
            />
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
