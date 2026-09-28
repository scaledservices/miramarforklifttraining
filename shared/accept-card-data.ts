// Accept.js constructCardData reads `.length` on every optional key that is
// PRESENT (hasOwnProperty), so `zip: undefined` crashes with
// "Cannot read properties of undefined (reading 'length')". Only include
// optional fields that actually have a value.
export function acceptCardData(f: { cardNumber: string; month: string; year: string; cardCode: string; zip?: string | null }) {
  const data: { cardNumber: string; month: string; year: string; cardCode: string; zip?: string } = {
    cardNumber: f.cardNumber.replace(/\s/g, ""),
    month: f.month.padStart(2, "0"),
    year: f.year.length === 2 ? `20${f.year}` : f.year,
    cardCode: f.cardCode,
  };
  const zip = (f.zip || "").trim();
  if (zip) data.zip = zip;
  return data;
}
