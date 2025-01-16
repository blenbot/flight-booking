export interface Booking {
    booking_id: number;
    user_id: number;
    flight_id: number;
    seats: number;
    total_price: number;
    status: 'confirmed' | 'cancelled';
    created_at: string;
    updated_at: string;
}