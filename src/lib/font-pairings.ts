export interface FontPairing {
  heading: string
  body: string
  headingWeight: number
  bodyWeight: number
  category: string
}

export const CURATED_PAIRINGS: FontPairing[] = [
  { heading: 'Playfair Display', body: 'Source Sans 3', headingWeight: 700, bodyWeight: 400, category: 'Classic' },
  { heading: 'Montserrat', body: 'Merriweather', headingWeight: 700, bodyWeight: 400, category: 'Modern' },
  { heading: 'Oswald', body: 'Quattrocento', headingWeight: 600, bodyWeight: 400, category: 'Editorial' },
  { heading: 'Raleway', body: 'Lato', headingWeight: 700, bodyWeight: 400, category: 'Clean' },
  { heading: 'Abril Fatface', body: 'Poppins', headingWeight: 400, bodyWeight: 300, category: 'Bold' },
  { heading: 'Cormorant Garamond', body: 'Fira Sans', headingWeight: 600, bodyWeight: 400, category: 'Elegant' },
  { heading: 'Work Sans', body: 'Bitter', headingWeight: 700, bodyWeight: 400, category: 'Professional' },
  { heading: 'DM Serif Display', body: 'DM Sans', headingWeight: 400, bodyWeight: 400, category: 'Harmonious' },
  { heading: 'Space Grotesk', body: 'Space Mono', headingWeight: 700, bodyWeight: 400, category: 'Tech' },
  { heading: 'Libre Baskerville', body: 'Open Sans', headingWeight: 700, bodyWeight: 400, category: 'Traditional' },
  { heading: 'Bebas Neue', body: 'Roboto', headingWeight: 400, bodyWeight: 300, category: 'Impact' },
  { heading: 'Crimson Pro', body: 'Work Sans', headingWeight: 600, bodyWeight: 400, category: 'Literary' },
  { heading: 'Lora', body: 'Nunito Sans', headingWeight: 700, bodyWeight: 400, category: 'Elegant' },
  { heading: 'Archivo Black', body: 'Roboto', headingWeight: 400, bodyWeight: 400, category: 'Impact' },
  { heading: 'Josefin Sans', body: 'Lora', headingWeight: 700, bodyWeight: 400, category: 'Modern' },
  { heading: 'Cardo', body: 'Josefin Sans', headingWeight: 700, bodyWeight: 400, category: 'Literary' },
  { heading: 'Prata', body: 'Lato', headingWeight: 400, bodyWeight: 400, category: 'Classic' },
  { heading: 'Rubik', body: 'Karla', headingWeight: 700, bodyWeight: 400, category: 'Clean' },
  { heading: 'Vollkorn', body: 'Nunito', headingWeight: 700, bodyWeight: 400, category: 'Traditional' },
  { heading: 'Syne', body: 'Inter', headingWeight: 700, bodyWeight: 400, category: 'Tech' },
]
