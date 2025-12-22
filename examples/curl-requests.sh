#!/bin/bash
# cURL Examples for MCP Blink Memory JSON-RPC 2.0 API

BASE_URL="http://localhost:7071"

echo "🔍 Health Check"
curl -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "healthCheck",
    "params": {},
    "id": 1
  }' | jq

echo -e "\n📝 Create Entities"
curl -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "createEntities",
    "params": {
      "entities": [
        {
          "name": "AI Research Lab",
          "type": "organization",
          "observations": [
            "Laboratory focused on artificial intelligence research",
            "Located in Bangkok, Thailand"
          ]
        }
      ],
      "options": {
        "autoTag": true,
        "linkToMemory0": true
      }
    },
    "id": 2
  }' | jq

echo -e "\n🔍 Semantic Search"
curl -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "semanticSearch",
    "params": {
      "query": "artificial intelligence research in Thailand",
      "options": {
        "topK": 5,
        "threshold": 0.3
      }
    },
    "id": 3
  }' | jq

echo -e "\n📊 Graph Stats"
curl -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "getGraphStats",
    "params": {},
    "id": 4
  }' | jq

echo -e "\n🔗 Create Relations"
curl -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "createRelations",
    "params": {
      "relations": [
        {
          "from": "AI Research Lab",
          "to": "Dr. Somchai AI",
          "relationType": "employs",
          "properties": {
            "role": "lead researcher",
            "since": "2020"
          }
        }
      ]
    },
    "id": 5
  }' | jq

echo -e "\n📋 Self Describe"
curl -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "selfDescribe",
    "params": {},
    "id": 6
  }' | jq