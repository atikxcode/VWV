'use client'
import Image from "next/image";
import Link from "next/link";
import HeroSlider from "../../components/HeroSlider";
import Branding from "../../components/Branding";


const slides = [

  {
    image: "Hero_Images/Hero_Image4.jpg",
    title: "Welcome to our platform",
    subtitle: "Explore the best products around you",
  },
  {
    image: "Hero_Images/Hero_Image5.jpg",
    title: "Welcome to our platform",
    subtitle: "Explore the best products around you",
  },
  {
    image: "Hero_Images/Hero_Image6.jpg",
    title: "Welcome to our platform",
    subtitle: "Explore the best products around you",
  },
  {
    image: "Hero_Images/Hero_Image7.jpg",
    title: "Welcome to our platform",
    subtitle: "Explore the best products around you",
  },
]

const brands = [
  {
    image: "/Brands Logo/Asos.png",
    id: "asos",
  },
  {
    image: "/Brands Logo/Etsy.png",
    id: "etsy",
  },
  {
    image: "/Brands Logo/Lois.png",
    id: "lois",
  },
  {
    image: "/Brands Logo/Nike.png",
    id: "nike",
  },
  {
    image: "/Brands Logo/Puma.png",
    id: "puma",
  },
  {
    image: "/Brands Logo/Reebok.png",
    id: "reebok",
  },
  {
    image: "/Brands Logo/Walmart.png",
    id: "walmart",
  },
  {
    image: "/Brands Logo/Zara.png",
    id: "zara",
  },
]




export default function Home() {
  return (
   <div>
    <HeroSlider slides={slides}></HeroSlider>
    <Branding brands={brands}></Branding>
    </div>
  );
}
