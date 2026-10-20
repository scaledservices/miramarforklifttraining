import i18n from "@/i18n";

/** Equipment names in shared/config/industries.ts are English-only. */
const ES: Record<string, string> = {
  "Aerial/Boom Lift": "Elevador aéreo / de brazo",
  "Dock Stocker": "Apilador de muelle",
  "Electric Pallet Jack (EPJ)": "Transpaleta eléctrica (EPJ)",
  "Empty Container Handler": "Manipulador de contenedores vacíos",
  "Heavy-duty Sit-down Forklift": "Montacargas de asiento para trabajo pesado",
  "Order Picker": "Recogepedidos",
  "Reach Stacker": "Apilador de alcance (Reach Stacker)",
  "Reach Truck": "Montacargas de alcance",
  "Rough Terrain Forklift (Class 7)": "Montacargas todo terreno (Clase 7)",
  "Scissor Lift": "Plataforma de tijera",
  "Sit-down Counterbalance Forklift": "Montacargas contrapesado de asiento",
  "Sit-down Counterbalance Forklift (Electric)": "Montacargas contrapesado de asiento (eléctrico)",
  "Sit-down Counterbalance Forklift (LPG)": "Montacargas contrapesado de asiento (gas LP)",
  "Telehandler": "Manipulador telescópico",
  "Terminal Tractor / Yard Goat": "Tractor de patio (Yard Goat)",
  "Tow Tractor": "Tractor de arrastre",
  "Walkie Stacker": "Apilador eléctrico de operador a pie",
};

export function equipmentName(name: string): string {
  if (!i18n.language?.startsWith("es")) return name;
  return ES[name.trim()] ?? name;
}
