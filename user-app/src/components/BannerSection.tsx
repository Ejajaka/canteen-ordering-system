import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BannerSectionProps {
  tokens?: string[];
}

export const BannerSection: React.FC<BannerSectionProps> = ({ tokens = [] }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentTokenIndex, setCurrentTokenIndex] = useState(0);

  const foodImages = [
    'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1893556/pexels-photo-1893556.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg?auto=compress&cs=tinysrgb&w=800',
  ];

  // Auto-rotate carousel if no tokens
  useEffect(() => {
    if (tokens.length === 0) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % foodImages.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [tokens.length, foodImages.length]);

  // Auto-rotate tokens if multiple
  useEffect(() => {
    if (tokens.length > 1) {
      const interval = setInterval(() => {
        setCurrentTokenIndex((prev) => (prev + 1) % tokens.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [tokens]);

  const handlePrevToken = () => {
    setCurrentTokenIndex((prev) => (prev - 1 + tokens.length) % tokens.length);
  };

  const handleNextToken = () => {
    setCurrentTokenIndex((prev) => (prev + 1) % tokens.length);
  };

  // If tokens exist → show tokens (replace carousel)
  if (tokens.length > 0) {
    return (
      <div className="mx-4 my-6">
        <div className="bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl p-6 text-center text-white shadow-lg relative">
          <h2 className="text-lg font-medium mb-2 opacity-90">Your Token Number</h2>
          <div className="text-4xl font-bold mb-2">{tokens[currentTokenIndex]}</div>
          <p className="text-sm opacity-80">Please wait for your order to be prepared</p>

          {tokens.length > 1 && (
            <>
              <button
                onClick={handlePrevToken}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={handleNextToken}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <div className="flex justify-center gap-2 mt-4">
                {tokens.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTokenIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentTokenIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Else show carousel
  return (
    <div className="mx-4 my-6">
      <div className="relative rounded-2xl overflow-hidden shadow-lg h-48">
        {foodImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img src={image} alt={`Promotion ${index + 1}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end">
              <div className="p-6 text-white">
                <h3 className="text-xl font-bold mb-2">Delicious Food Awaits</h3>
                <p className="text-sm opacity-90">Fresh ingredients, amazing taste</p>
              </div>
            </div>
          </div>
        ))}

        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          {foodImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};