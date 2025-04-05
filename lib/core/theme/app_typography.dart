import 'package:flutter/material.dart';

class AppTypography {
  static const String fontFamily = 'Roboto';
  static const String headlineFontFamily = 'Playfair Display';
  
  // Headline Styles
  static const TextStyle h1 = TextStyle(
    fontSize: 32,
    fontWeight: FontWeight.bold,
    fontFamily: headlineFontFamily,
    height: 1.5,
    letterSpacing: -0.5,
  );
  
  static const TextStyle h2 = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.bold,
    fontFamily: headlineFontFamily,
    height: 1.5,
    letterSpacing: -0.25,
  );
  
  static const TextStyle h3 = TextStyle(
    fontSize: 20,
    fontWeight: FontWeight.bold,
    fontFamily: headlineFontFamily,
    height: 1.5,
    letterSpacing: 0,
  );
  
  // Body Styles
  static const TextStyle bodyText = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.normal,
    fontFamily: fontFamily,
    height: 1.5,
    letterSpacing: 0.15,
  );
  
  static const TextStyle caption = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.normal,
    fontFamily: fontFamily,
    height: 1.4,
    letterSpacing: 0.1,
  );
  
  static const TextStyle label = TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w500,
    fontFamily: fontFamily,
    height: 1.3,
    letterSpacing: 0.5,
  );

  // Button Text Style
  static const TextStyle button = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w500,
    fontFamily: fontFamily,
    height: 1.4,
    letterSpacing: 0.25,
  );

  // Input Field Text Style
  static const TextStyle input = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.normal,
    fontFamily: fontFamily,
    height: 1.5,
    letterSpacing: 0.15,
  );
} 