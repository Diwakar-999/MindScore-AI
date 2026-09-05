import joblib
import pandas as pd
import xgboost as xgb
from fastapi import FastAPI
from pathlib import Path
from pydantic import BaseModel, Field
from typing import Literal
from fastapi.middleware.cors import CORSMiddleware

BASE_DIR = Path(__file__).resolve().parent
PREPROCESSOR_PATH = BASE_DIR / "preprocessor.pkl"
MODEL_PATH = BASE_DIR / "xgb_model.json"


preprocessor = joblib.load(PREPROCESSOR_PATH)


xgb_model = xgb.XGBRegressor()
xgb_model.load_model(MODEL_PATH)
 
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*']
)

@app.get("/")
def greet():
    return {"message": "Welcome to Chauhan Businesses Point"}



class StudentInput(BaseModel):
    Age                     : int = Field(..., ge=10,le=100)
    Gender                  : Literal['Male','Female']
    Country                 : str
    Academic_Level          : Literal['Undergraduate', 'Graduate', 'High School']
    Most_Used_Platform      : Literal['Facebook', 'LinkedIn', 'Instagram', 'Snapchat', 'Twitter','YouTube', 'TikTok', 'LINE', 'KakaoTalk', 'VKontakte', 'WhatsApp','WeChat']
    Purpose_Of_Use          : Literal['Networking', 'Education', 'Entertainment', 'News']
    Avg_Daily_Usage_Hours   : float = Field(...,ge = 0,le = 24)
    Daily_Unlocks           : int = Field(...,ge = 0)
    Study_Hours             : float = Field(...,ge = 0,le = 24)
    Physical_Activity_Hours : float = Field(...,ge = 0,le = 24)
    Sleep_Hours_Per_Night   : float = Field(...,ge = 0,le = 24)
    Stress_Level            : Literal['Medium', 'Low', 'Very High', 'High']  # one of: Low, Medium, High, Very High

top_countries = ['Other','India','USA','Canada','Australia','UK','Germany','Mexico','Turkey','France']

class PredictionResponse(BaseModel):
    predicted_mental_health_score : float



@app.post("/predict",response_model=PredictionResponse)
def predict(data: StudentInput):
    country_group = data.Country if data.Country in top_countries else 'Other'
    input_row = pd.DataFrame([{
        'Age'                       : data.Age,
        'Gender'                    : data.Gender,
        'Country'                   : data.Country,
        'Academic_Level'            : data.Academic_Level,
        'Most_Used_Platform'        : data.Most_Used_Platform,
        'Purpose_Of_Use'            : data.Purpose_Of_Use,
        'Avg_Daily_Usage_Hours'     : data.Avg_Daily_Usage_Hours,
        'Daily_Unlocks'             : data.Daily_Unlocks,
        'Study_Hours'               : data.Study_Hours,
        'Physical_Activity_Hours'   : data.Physical_Activity_Hours,
        'Sleep_Hours_Per_Night'     : data.Sleep_Hours_Per_Night,
        'Stress_Level'              : data.Stress_Level,
        'Grouped_countries'         : country_group
    }])

    # Run the same preprocessing used during training
    transformed = preprocessor.transform(input_row)

    # Predict with the natively-loaded XGBoost model
    prediction = xgb_model.predict(transformed)

    return PredictionResponse(predicted_mental_health_score= round(float (prediction[0]),2)) 