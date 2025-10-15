import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Card,
  CardBody,
  Heading,
  Text,
  Spinner,
  Button,
  useToast,
} from "@chakra-ui/react";
import { confirmAndUnlock } from "../lib/api";

export default function CustomerReturn() {
  const toast = useToast();
  const [status, setStatus] = useState("init");
  const [message, setMessage] = useState("Waiting…");
  const [debug, setDebug] = useState(null);
  const didConfirmRef = useRef(false);

  useEffect(() => {
    if (didConfirmRef.current) return; // guard
    async function run() {
      try {
        console.log("[RETURN] page boot");
        const params = new URLSearchParams(window.location.search);
        const paymentId = params.get("id") || params.get("payment_id");
        const payStatus = params.get("status");

        console.log("[RETURN] query:", { paymentId, payStatus });

        if (!paymentId) {
          setStatus("error");
          setMessage("Missing payment id.");
          toast({ status: "error", title: "Missing payment id" });
          return;
        }

        const raw = localStorage.getItem("pendingPaymentSelection");
        console.log("[RETURN] localStorage.pendingPaymentSelection:", raw);
        if (!raw) {
          setStatus("error");
          setMessage(
            "Missing selection data. Please reselect stroller and package."
          );
          toast({ status: "error", title: "No selection data found" });
          return;
        }
        didConfirmRef.current = true; // prevent second run

        const sel = JSON.parse(raw);
        console.log("[RETURN] selection parsed:", sel);
        const payload = {
          paymentId,
          deviceNo: sel.deviceNo,
          cartNo: sel.cartNo,
          cartIndex: Number(sel.cartIndex),
          siteNo: sel.siteNo || null,
          amountHalalas: Number(sel.amountHalalas),
        };
        console.log("[RETURN] confirm payload:", payload);

        setStatus("confirming");
        setMessage("Confirming payment and unlocking stroller…");

        const res = await confirmAndUnlock(payload);
        console.log("[RETURN] confirm result:", res);
        setDebug(res);

        if (res?.code === "00000" && res?.data?.vendor?.code === "00000") {
          setStatus("ok");
          setMessage("Unlock sent successfully! Enjoy your ride.");
          toast({ status: "success", title: "Unlock sent" });

          // clear once successful
          localStorage.removeItem("pendingPaymentSelection");
        } else {
          setStatus("error");
          setMessage(
            `Unlock failed: ${
              res?.data?.vendor?.msg || res?.msg || "Unknown error"
            }`
          );
          toast({ status: "error", title: "Unlock failed" });
        }
      } catch (err) {
        console.error("[RETURN] error:", err);
        setStatus("error");
        setMessage("Server error. Please contact support.");
        setDebug({ error: String(err) });
        toast({ status: "error", title: "Server error" });
      }
    }
    run();
  }, []);

  return (
    <Box maxW="xl" mx="auto" p={6}>
      <Card variant="outline" rounded="2xl">
        <CardBody>
          <Heading size="md" mb={3}>
            Completing your rental…
          </Heading>
          {status === "confirming" && (
            <Box display="flex" alignItems="center" gap={3}>
              <Spinner /> <Text>{message}</Text>
            </Box>
          )}
          {status === "ok" && <Text color="green.600">{message}</Text>}
          {status === "error" && <Text color="red.600">{message}</Text>}

          <Box
            as="pre"
            fontSize="xs"
            mt={4}
            p={3}
            bg="gray.50"
            borderWidth="1px"
            rounded="md"
            overflow="auto"
          >
            {JSON.stringify(debug, null, 2)}
          </Box>

          <Button
            mt={4}
            onClick={() => (window.location.href = "/?deviceNo=91001107")}
          >
            Back to Customer
          </Button>
        </CardBody>
      </Card>
    </Box>
  );
}
