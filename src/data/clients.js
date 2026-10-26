// Organisations Sky Eye has worked with, shown on the About page (grid) and
// the home page (scrolling strip). Each entry: { name, group, logo?, sector? }
// — `logo` is an image URL; without one the name is set in type instead.
// Logos with the State Emblem of India or military/police insignia are left
// out on purpose (their use by companies is restricted).
// Logos are hosted on Cloudinary (folder skyeye/clients), resized on delivery
const logo = (slug) => `https://res.cloudinary.com/mnwkyinw/image/upload/h_160,f_auto,q_auto/skyeye/clients/${slug}.png`

export const CLIENTS = [
  { group: 'org', name: 'Drone Mandi', sector: 'Drone services', logo: logo('drone-mandi') },
  { group: 'org', name: 'Lakir Technologies', sector: 'Drone tech' },
  { group: 'org', name: 'BHEL', sector: 'Public sector', logo: logo('bhel') },
  { group: 'org', name: 'Jems & Jewellers', sector: 'Jewellery' },
  { group: 'org', name: 'Aerovania Pvt. Ltd.', sector: 'Drone tech' },
  { group: 'org', name: 'QIK Techsoft Solution', sector: 'Software' },
  { group: 'org', name: 'Theta Foundation for Development', sector: 'Non-profit' },
  { group: 'org', name: 'Leo Power Construction', sector: 'Construction' },
  { group: 'org', name: 'OMFED', sector: 'Dairy co-op', logo: logo('omfed') },
  { group: 'org', name: 'NCCBM', sector: 'Govt research body', logo: logo('nccbm') },
  { group: 'org', name: 'Professional Real Estate Pvt. Ltd.', sector: 'Real estate' },
  { group: 'org', name: 'DKM Consult Pvt. Ltd.', sector: 'Engineering consultancy' },
  { group: 'org', name: 'IFFCO', sector: 'Fertiliser co-op', logo: logo('iffco') },
  { group: 'org', name: 'RaSpect AI', sector: 'AI inspection', logo: logo('raspect-ai') },
  { group: 'org', name: 'Survey of India', sector: 'Mapping' },
  { group: 'org', name: 'FWSTC', sector: 'Aviation training' },
  { group: 'org', name: 'Bridge & Roof Co.', sector: 'Public sector', logo: logo('bridge-and-roof') },
  { group: 'org', name: 'Swosti Premium', sector: 'Hospitality', logo: logo('swosti-premium') },
  { group: 'org', name: 'Indian Army', sector: 'Defence' },
  { group: 'org', name: 'Rashtriya Rifles', sector: 'Defence' },
  { group: 'org', name: 'Raipur Police', sector: 'Law enforcement' },
  { group: 'org', name: 'NAWAH', sector: 'Real estate', logo: logo('nawah') },
  { group: 'org', name: 'WBIDC', sector: 'West Bengal Industrial Development Corp.', logo: logo('wbidc') },
  { group: 'org', name: 'AviaSafe Aviation Services Pvt. Ltd.', sector: 'Aviation' },
  { group: 'education', name: 'Delhi Public School', sector: 'School', logo: logo('delhi-public-school') },
  { group: 'education', name: 'St. Xavier High School', sector: 'School' },
  { group: 'education', name: 'School of Aeronautics', sector: 'Aviation education' },
  { group: 'education', name: 'International Delhi Public School', sector: 'School' },
  { group: 'education', name: 'Kendriya Vidyalaya', sector: 'School', logo: logo('kendriya-vidyalaya') },
  { group: 'education', name: 'KIIT', sector: 'University', logo: logo('kiit') },
]

export const CLIENT_GROUPS = [
  { key: 'org', label: 'Industry & government' },
  { key: 'education', label: 'Education' },
]
