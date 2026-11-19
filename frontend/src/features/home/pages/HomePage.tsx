import HeroBanner from '../components/HeroBanner';
import FeaturedCategories from '../components/FeaturedCategories';
import NewArrivals from '../components/NewArrivals';
import BestSellers from '../components/BestSellers';

export default function HomePage() {
  return <main className="nx-home"><div className="nx-container"><HeroBanner /><FeaturedCategories /><BestSellers /><NewArrivals /></div></main>;
}
