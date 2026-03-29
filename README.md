# 🌾 YieldIQ

**AI-Powered Agricultural Intelligence for the Modern Farmer**

YieldIQ is a scientifically-backed precision agriculture platform designed to empower farmers with data-driven insights. By combining Google Gemini's advanced parsing capabilities with established agronomy models (FAO-56 & Maas-Hoffman), YieldIQ transforms raw lab reports and real-time telemetry into actionable harvest forecasts and irrigation schedules.

## 🚀 Key Features

- **🔬 Scientific Advisory**: Automatically parse IS-10500 water/soil reports to calculate salinity penalties, sodicity hazards (SAR/RSC), and soil structural risks.
- **📈 Harvest Forecasting**: High-accuracy yield predictions based on soil type, crop variety, and real-time weather conditions from Open-Meteo.
- **💧 Dynamic Irrigation**: Live irrigation scheduling derived from ETo (Evapotranspiration) and crop-specific coefficients (Kc).
- **📡 Intelligence Pipeline**: Visualize the flow of data from edge sensors through standardization and normalization into AI insights.
- **🗣️ Multilingual Assistant**: A conversational AI that speaks the farmer's language (Hindi, Marathi, English) to provide expert guidance.
- **🗺️ GIS Visualization**: Satellite-level insights including NDVI health indexing and moisture mapping.

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, ShadCN UI.
- **Backend**: Firebase (Authentication, Firestore).
- **Generative AI**: Google Genkit 1.x, Gemini 2.5 Flash.
- **Data APIs**: Open-Meteo (Weather & Hydrology).
- **Charts**: Recharts.

## 📦 Local Setup

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd yieldiq
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file and add your Google AI API Key:
   ```env
   GOOGLE_GENAI_API_KEY=your_key_here
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:9002](http://localhost:9002) to view the dashboard.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🏆 Hackathon Note

This project was built for my **first-ever hackathon!** 🚀
YieldIQ represents my journey into precision agriculture and AI-driven sustainable farming. It was a challenging and rewarding experience to build a full-stack solution that addresses real-world agricultural problems.

---
*Built with ❤️ for the Hackathon - Empowering Agriculture through AI.*
