export interface CostData {
    flight_id: number;
    responsible_id: number;
    direct_cost: number;
    hangar: number;
    fuel: number;
    notes: string;
    receipt_photos: string[]; // <-- array of URLs
  }