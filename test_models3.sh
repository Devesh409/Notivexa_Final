for model in "gemini-1.5-flash" "gemini-1.5-pro"; do
  echo "Testing $model..."
  curl -s -H "Content-Type: application/json" \
       -H "x-goog-api-key: ${GEMINI_API_KEY}" \
       -X POST -d '{"contents": [{"parts": [{"text": "hello"}]}]}' \
       "https://generativelanguage.googleapis.com/v1beta/models/$model:generateContent" | grep "error" -A 10
done
