import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen bg-gray-900 flex flex-col items-center justify-center"
    >
      <motion.div 
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        className="flex items-center gap-4 mb-6"
      >
        <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          Aerocheck
        </h1>
        <img 
          src="https://png.pngtree.com/png-clipart/20220509/original/pngtree-flying-airplane-vector-png-png-image_7690263.png" 
          alt="Airplane" 
          className="h-24 w-24 object-contain"
        />
      </motion.div>
      
      <motion.p 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl text-gray-400 mb-8"
      >
        Connecting people across the globe
      </motion.p>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="space-x-4"
      >
        <Button 
          variant="default"
          className="bg-blue-600 hover:bg-blue-700 px-8"
          onClick={() => navigate('/login')}
        >
          Login
        </Button>
        <Button 
          variant="outline"
          className="text-black border-white hover:bg-gray-800 px-8"
          onClick={() => navigate('/register')}
        >
          Register
        </Button>
      </motion.div>
    </motion.div>
  );
}