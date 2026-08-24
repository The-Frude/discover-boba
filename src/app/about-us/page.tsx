import React from 'react';
import OptimizedImage from '@/components/OptimizedImage';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us | Discover Boba',
  description: 'Learn more about DiscoverBoba.com and our mission to help you find the best bubble tea shops near you.',
  alternates: {
    canonical: '/about-us',
  },
};

const AboutUsPage: React.FC = () => {
  return (
    <div className="container-custom py-12">
      <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center">
        {/* Text Content Area */}
        <div className="md:w-1/2 space-y-6">
          <h1 className="text-4xl font-bold text-primary mb-6">About Us</h1>
          <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
            Discover Boba tracks 800+ boba tea shops across 7 U.S. metro areas — Atlanta, Chicago, Dallas, New York, Philadelphia, Seattle, and Washington D.C.
          </p>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            At DiscoverBoba.com, we make it easy (and fun) to find the best bubble tea shops near you. Whether you're searching for a cozy neighborhood spot or a trendy new boba place to try with friends, our goal is to help you discover local tea shops that match your taste, your vibe, and your lifestyle. We believe bubble tea is more than just a drink—it's a connection to culture, creativity, and community.
          </p>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            Our team is constantly adding new cities and curating top-rated boba shops across the country, with a special focus on small and locally owned businesses. From traditional Taiwanese milk tea to Instagram-worthy fruit blends, we highlight places that serve up great flavors, warm service, and a welcoming atmosphere. If you're asking “Where can I find great boba near me?”—you’re in the right place.
          </p>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            DiscoverBoba.com is also growing into a hub for bubble tea lovers to connect and explore. New social features are on the way to let you share your favorite spots, save custom lists, and get recommendations based on your personal preferences. We're building a community around the love of boba, one city at a time.
          </p>
        </div>

        {/* Image Area */}
        <div className="md:w-1/2 flex justify-center md:justify-end">
          <div className="w-full max-w-md rounded-lg overflow-hidden shadow-lg">
            <OptimizedImage
              src="/images/boba-family.png" // Path relative to /public
              alt="A diverse group of friends enjoying bubble tea together"
              width={600} // Intrinsic width of the image or desired render width
              height={400} // Intrinsic height of the image or desired render height
              layout="responsive" // Makes the image scale with the container
              className="object-cover" // Ensures the image covers the area nicely
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUsPage;
