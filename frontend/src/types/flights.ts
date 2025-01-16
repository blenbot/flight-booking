// Interface for a flight
export interface Flight {
  flight_id: number;
  airline_name: string;
  flight_number: string;
  source: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  total_seats: number;
  available_seats: number;
  price: number;
  status: string;
}
  
  // Interface for payment details
  export interface PaymentDetails {
    cardType: string;
    cardNumber: string;
    expirationDate: string;
    cvv: string;
    name: string 
  }