import pandas as pd
import os
import glob

df = pd.read_csv("./Sources of Revenue_State of Hawaii-Annual.csv")
dfNew = df.apply(float)
print(dfNew)
# dfNew = df.T
# dfNew.to_csv("./Sources of Revenue_State of Hawaii-Annual.csv", mode='a')