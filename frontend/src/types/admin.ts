export interface Flight {
    flight_id: number;
    airline_name: string;
    flight_number?: string;
    source: string;
    destination: string;
    departure_time: string;
    arrival_time: string;
    total_seats: number;
    available_seats: number;
    price: number;
    status: 'scheduled' | 'delayed' | 'boarding' | 'departed' | 'arrived' | 'cancelled';
    created_at?: string;
    updated_at?: string;
  }


  export interface NewFlight {
    airline_name: string;
    source: string;
    destination: string;
    departure_time: string;
    arrival_time: string;
    total_seats: number;
    available_seats: number;
    price: number;
    status: 'scheduled' | 'delayed' | 'boarding' | 'departed' | 'arrived' | 'cancelled';
  }

export interface AdminDashboardProps {
    flights: Flight[]; // List of flights
    onAddFlight: (flight: Flight) => void; // Callback for adding a flight
    onDeleteFlight: (flightId: string) => void; // Callback for deleting a flight
}