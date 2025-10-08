// src/components/PaymentReturn.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Spinner,
  useToast,
  Button,
} from "@chakra-ui/react";

export default function PaymentReturn() {
  const toast = useToast();
  const [status, setStatus] = useState("verifying"); // verifying | ok | fail
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentId = params.get("id");
    const selRaw = localStorage.getItem("pendingPaymentSelection");
    if (!paymentId || !selRaw) {
      setStatus("fail");
      setMsg("Missing payment context");
      return;
    }
    const sel = JSON.parse(selRaw);
    // POST to server to verify payment & unlock
    fetch("/api/payments/confirm-and-unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId, ...sel }),
    })
      .then((r) => r.json())
      .then((r) => {
        if (r?.ok) {
          setStatus("ok");
          setMsg("Payment confirmed. Unlock sent.");
          localStorage.removeItem("pendingPaymentSelection");
        } else {
          setStatus("fail");
          setMsg(r?.msg || "Verification failed");
        }
      })
      .catch(() => {
        setStatus("fail");
        setMsg("Network error");
      });
  }, []);

  return (
    <Card variant="outline" rounded="2xl">
      <CardHeader>
        <Heading size="md">Payment Result</Heading>
      </CardHeader>
      <CardBody>
        {status === "verifying" && (
          <>
            <Spinner size="sm" />{" "}
            <Text as="span" ml={2}>
              Verifying payment…
            </Text>
          </>
        )}
        {status === "ok" && <Text color="green.600">{msg}</Text>}
        {status === "fail" && <Text color="red.600">{msg}</Text>}
        <Box mt={4}>
          <Button onClick={() => (window.location.href = "/")}>
            Back to app
          </Button>
        </Box>
      </CardBody>
    </Card>
  );
}
