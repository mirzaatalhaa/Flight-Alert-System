import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

const sns = new SNSClient({ region: "ap-south-1" });

const dynamoClient = new DynamoDBClient({
  region: "ap-south-1",
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const handler = async () => {
  const response = await fetch(
    "https://api.airplanes.live/v2/point/10.1520/76.4019/250"
  );

  const data = await response.json();

  console.log("Aircraft count:", data.ac?.length || 0);

  const rulesResponse = await docClient.send(
    new ScanCommand({
      TableName: "AlertRules",
    })
  );

  const alertTypes = rulesResponse.Items
    .filter(
      (rule) =>
        rule.ruleType === "aircraftType"
    )
    .map((rule) => rule.value);

  console.log("Loaded rules:", alertTypes);

  const airlineMap = {
    SVA: "Saudia",
    UAE: "Emirates",
    QTR: "Qatar Airways",
    ETD: "Etihad Airways",
    JZR: "Jazeera Airways",
    SIA: "Singapore Airlines",
    IGO: "IndiGo",
    AIC: "Air India",
    VTI: "Air India Express",
    ABY: "Air Arabia",
    FDB: "flydubai",
    KAC: "Kuwait Airways",
    OMA: "Oman Air",
    GFA: "Gulf Air",
    THY: "Turkish Airlines",
    BAW: "British Airways",
    DLH: "Lufthansa",
    CPA: "Cathay Pacific",
    CCA: "Air China",
    CES: "China Eastern",
    CSN: "China Southern",
    CAL: "China Airlines",
    EVA: "EVA Air",
  };

  const matches =
    data.ac?.filter((aircraft) =>
      alertTypes.includes(aircraft.t)
    ) || [];

  console.log("Interesting aircraft found:", matches.length);

  if (matches.length === 0) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "No interesting aircraft found",
      }),
    };
  }

  let alertsSent = 0;

  for (const aircraft of matches) {
    console.log(
      `Checking ${aircraft.flight} ${aircraft.r} (${aircraft.t})`
    );

    const existingAircraft = await docClient.send(
      new GetCommand({
        TableName: "AlertedAircraft",
        Key: {
          registration: aircraft.r,
        },
      })
    );

    if (existingAircraft.Item) {
      console.log(
        `Skipping ${aircraft.r} - already alerted`
      );
      continue;
    }

    const callsign = aircraft.flight?.trim() || "";
    const airlineCode = callsign.substring(0, 3);

    const airlineName =
      airlineMap[airlineCode] || "Unknown Airline";

    await sns.send(
      new PublishCommand({
        TopicArn:
          "arn:aws:sns:ap-south-1:424322298959:skytracker-flight-alerts",

        Subject: `SkyTracker Alert - ${airlineName}`,

        Message: `
🚨 Interesting Aircraft Detected

Airline: ${airlineName}
Flight: ${callsign}
Registration: ${aircraft.r}
Aircraft Type: ${aircraft.t}
Description: ${aircraft.desc}

Altitude: ${aircraft.alt_baro} ft
Ground Speed: ${aircraft.gs} knots

Latitude: ${aircraft.lat}
Longitude: ${aircraft.lon}

Detected over Cochin Airspace
        `.trim(),
      })
    );

    const expiresAt =
      Math.floor(Date.now() / 1000) + (24 * 60 * 60);

    await docClient.send(
      new PutCommand({
        TableName: "AlertedAircraft",
        Item: {
          registration: aircraft.r,
          expiresAt,
        },
      })
    );

    alertsSent++;

    console.log(
      `Alert sent for ${aircraft.r} (${airlineName})`
    );
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      matchesFound: matches.length,
      alertsSent,
    }),
  };
};
