import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowUpDown } from "lucide-react";
import {Flight, PaymentDetails} from "@/types/flights";
import {Booking} from "@/types/bookings";

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth(); 
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [flights, setFlights] = useState<Flight[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showPayment, setShowPayment] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    cardType: '',
    cardNumber: '',
    expirationDate: '',
    cvv: '',
    name: ''
  });
  const [bookingsWithFlightInfo, setBookingsWithFlightInfo] = useState<(Booking & Partial<Flight>)[]>([]);
  const [cardNumberError, setCardNumberError] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: ''
  });

  const fetchBookingDetails = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/bookings', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        }
      });
      if (!response.ok) throw new Error('Failed to fetch bookings');
      const bookings: Booking[] = await response.json();
      
      const bookingsWithDetails = await Promise.all(
        bookings.map(async (booking) => {
          const flightResponse = await fetch(`http://localhost:5000/api/v1/flights/${booking.flight_id}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            }
          });
          const flight: Flight = await flightResponse.json();
          return {
            ...booking,
            source: flight.source,
            destination: flight.destination,
            departure_time: flight.departure_time,
            price: flight.price
          };
        })
      );
      
      setBookingsWithFlightInfo(bookingsWithDetails);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    fetchBookingDetails();
  }, []);


  const handleSearch = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/v1/flights/search?source=${from}&destination=${to}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setFlights(data);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const toggleSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    setFlights(prev => [...prev].sort((a, b) => 
      sortOrder === 'asc' ? a.price - b.price : b.price - a.price
    ));
  };


  const handleBooking = (flight: Flight) => {
    setSelectedFlight(flight);
    setShowPayment(true);
  };
  
  const handlePayment = async () => {
    if (!selectedFlight) {
      alert('No flight selected');
      return;
    }
  
    try {
      const bookingResponse = await fetch('http://localhost:5000/api/v1/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          flight_id: selectedFlight.flight_id,
          seats: 1,
        })
      });
  
      if (!bookingResponse.ok) throw new Error('Booking failed');
      
      const bookingData = await bookingResponse.json();

      const paymentResponse = await fetch('http://localhost:5000/api/v1/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          booking_id: bookingData.booking.booking_id,
          card_type: paymentDetails.cardType || 'credit',
          card_number: paymentDetails.cardNumber,
          expiration_date: paymentDetails.expirationDate,
          cvv: paymentDetails.cvv,
          name_on_card: paymentDetails.name,
          amount: selectedFlight.price
        })
      });
  
      if (!paymentResponse.ok) throw new Error('Payment processing failed');
  
      setShowPayment(false);
      setShowSuccess(true);
      await fetchBookingDetails();
    } catch (error) {
      console.error('Error:', error);
      alert('Booking failed. Please try again.');
    }
  };
  
  const handleCancelBooking = async (bookingId: number) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/v1/bookings/${bookingId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      if (!response.ok) throw new Error('Failed to cancel booking');
      await fetchBookingDetails();
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to cancel booking. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setPaymentDetails({ ...paymentDetails, cardNumber: value });
    
    if (value.length > 0 && value.length !== 16) {
      setCardNumberError('Card number must be 16 digits');
    } else {
      setCardNumberError(null);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) throw new Error('Failed to update profile');

      const data = await response.json();
      setUser(data.user);
      setShowProfile(false);
    } catch (error) {
      console.error('Update profile error:', error);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/v1/users/profile', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete account');

      localStorage.removeItem('token');
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Delete account error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gray-400 shadow-sm py-4 px-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
          Aerocheck
        </h1>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => setShowProfile(true)} className="text-black">
            Update Profile
          </Button>
          <Button variant="outline" onClick={handleLogout} className="border-red-500 hover:bg-red-500 hover:text-white text-red-500">Logout</Button>
        </div>
      </nav>

      <div className="flex">
        <div className="flex-1 p-8">
          {/* Add greeting section */}
          <div className="flex items-center gap-3 mb-6">
            <img 
              src="https://img.freepik.com/premium-vector/waving-hand-icon-yellow-gesture-emoji-vector-illustration_212216-1030.jpg"
              alt="Waving hand"
              className="w-10 h-10 rounded-full"
            />
            <h2 className="text-2xl font-semibold text-black">
              Hey {user?.name || 'there'}!
            </h2>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Search Flights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  placeholder="From"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="To"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSearch}>Search</Button>
              </div>
            </CardContent>
          </Card>

          {flights.length > 0 && (
            <div className="mb-4 flex justify-end">
              <Button variant="outline" onClick={toggleSort} className="bg-cyan-500 hover:bg-cyan-600 text-black border-cyan-600">
                Sort by Price <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="grid gap-4">
            {flights.map((flight) => (
              <Card key={flight.flight_id}>
                <CardContent className="flex justify-between items-center p-6">
                  <div>
                    <p className="font-semibold">{flight.source} → {flight.destination}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(flight.arrival_time).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      Available seats: {flight.available_seats}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-bold">${flight.price}</p>
                    <Button onClick={() => handleBooking(flight)}>Book Now</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="w-80 bg-blue-500 p-6 border-l">
          <h2 className="font-semibold mb-4">Your Bookings</h2>
          <div className="space-y-4">
            {bookingsWithFlightInfo
              .filter(b => b.status === 'confirmed')
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 5)
              .map((booking) => (
                <Card key={booking.booking_id}>
                  <CardContent className="p-4">
                    <p className="font-medium">{booking.source} → {booking.destination}</p>
                    <p className="text-sm text-black-500">
                      {booking.departure_time ? new Date(booking.departure_time).toLocaleDateString() : 'No date available'}
                    </p>
                    <p className="text-sm font-semibold">${booking.total_price}</p>
                    <Button 
                      variant="destructive" 
                      className="mt-2" 
                      onClick={() => handleCancelBooking(booking.booking_id)}
                    >
                      Cancel Booking
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>

          <Separator className="my-6" />

         
        </div>
      </div>

      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-black">Payment Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select onValueChange={(value) => setPaymentDetails({...paymentDetails, cardType: value})}>
              <SelectTrigger className="text-black">
                <SelectValue 
                  placeholder="Select Card Type" 
                  className="text-black"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit">Credit Card</SelectItem>
                <SelectItem value="debit">Debit Card</SelectItem>
              </SelectContent>
            </Select>
            <div className="space-y-2">
              <Input 
                className={`text-2xl font-semibold text-black ${cardNumberError ? 'border-red-500' : ''}`}
                placeholder="Card Number"
                maxLength={16}
                value={paymentDetails.cardNumber}
                onChange={handleCardNumberChange}
              />
              {cardNumberError && (
                <p className="text-sm text-red-500">{cardNumberError}</p>
              )}
            </div>
            <Input className="text-2xl font-semibold text-black"
              placeholder="Expiration (MM/YY)"
              maxLength={5}
              value={paymentDetails.expirationDate}
              onChange={(e) => {
                let value = e.target.value;
                value = value.replace(/\D/g, '');
                if (value.length >= 2) {
                  value = value.slice(0, 2) + '/' + value.slice(2);
                }
                setPaymentDetails({
                  ...paymentDetails,
                  expirationDate: value
                });
              }}
            />
            <Input className="text-2xl font-semibold text-black"
              placeholder="CVV"
              maxLength={3}
              value={paymentDetails.cvv}
              onChange={(e) => setPaymentDetails({
                ...paymentDetails,
                cvv: e.target.value.replace(/\D/g, '')
              })}
            />
            <Input className="text-2xl font-semibold text-black"
              placeholder="Name on Card"
              value={paymentDetails.name}
              onChange={(e) => setPaymentDetails({...paymentDetails, name: e.target.value})}
            />
            <Button className="w-full" onClick={handlePayment}>Pay Now</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="text-center">
          <img
            src="https://cdn-icons-png.flaticon.com/512/9245/9245020.png"
            alt="Success"
            className="w-24 h-24 mx-auto mb-4"
          />
          <DialogTitle>Booking Successful!</DialogTitle>
          <p className="text-gray-500">Your flight has been booked successfully.</p>
          <Button className="mt-4" onClick={() => setShowSuccess(false)}>Close</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-black">Update Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              className="text-black"
              placeholder="Name"
              value={profileData.name}
              onChange={(e) => setProfileData({...profileData, name: e.target.value})}
            />
            <Input
              className="text-black"
              placeholder="Email"
              value={profileData.email}
              onChange={(e) => setProfileData({...profileData, email: e.target.value})}
            />
            <Input
              className="text-black"
              type="password"
              placeholder="New Password (optional)"
              value={profileData.password}
              onChange={(e) => setProfileData({...profileData, password: e.target.value})}
            />
            <Button onClick={handleUpdateProfile} className="w-full">
              Update Profile
            </Button>
            <Separator />
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount}
              className="w-full"
            >
              Delete Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
