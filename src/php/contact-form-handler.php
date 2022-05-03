<?php
require_once "dotenv.php";
require_once "mail-config.php";

$recaptcha_secret = getenv("RECAPTCHA_SECRET_KEY");

function clean($data) {
  $data = trim($data);
  $data = stripslashes($data);
  $data = htmlspecialchars($data);
  return $data;
}

if($_SERVER["REQUEST_METHOD"] === "POST") {

  $name = clean($_POST["name"]);
  $email_address = clean($_POST["email"]);
  $subject = clean($_POST["subject"]);
  $message = clean($_POST["message"]);
  $email_heading = clean($_POST["heading"]);

  $thankyou_html_template = file_get_contents("email/contact-thankyou.html");
  $thankyou_txt_template = file_get_contents("email/contact-thankyou.txt");
  $message_html_template = file_get_contents("email/contact-message.html");
  $message_txt_template = file_get_contents("email/contact-message.txt");

  $placeholders = [
    "%name%",
    "%message%",
    "%email_heading%",
  ];

  $values = [
    $name,
    $message,
    $email_heading,
  ];

  $thankyou_html_body = str_replace($placeholders, $values, $thankyou_html_template);
  $thankyou_txt_body = str_replace($placeholders, $values, $thankyou_txt_template);
  $message_html_body = str_replace($placeholders, $values, $message_html_template);
  $message_txt_body = str_replace($placeholders, $values, $message_txt_template);

  /* DEBUG
  echo $thankyou_html_body;
  exit;
   */

  // ========== reCaptcha ==========

  $g_recaptcha_response = $_POST["g-recaptcha-response"];
  $remote_ip = $_SERVER["REMOTE_ADDR"];
  $url = "https://www.google.com/recaptcha/api/siteverify?secret=" . urlencode($recaptcha_secret) . "&response=" . urlencode($g_recaptcha_response) . "&remoteip=" . urlencode($remote_ip);

  $response = file_get_contents($url);
  $responseKeys = json_decode($response, true);

  if($responseKeys["success"] && $responseKeys["action"] == "contactform") {
    if($responseKeys["score"] >= 0.5) {

      // ========== Contact Form Email ==========

      try {
        $mail->clearAddresses();
        $mail->addAddress($floriade_email, "Floriade");
        $mail->setFrom($email_address, $name);
        $mail->Subject = $subject;

        $mail->Body = $message_html_body;
        $mail->AltBody = $message_txt_body;

        $mail->send();

      } catch (Exception $e) {
        header("Location:/contact-form-error/?p=" . urlencode($mail->ErrorInfo));
        exit;
      }

      // ========== Confirmation Email ==========

      try {
        $mail->clearAddresses();
        $mail->addAddress($email_address, $name);
        $mail->setFrom($floriade_email, "Floriade");
        $mail->Subject = $subject . " (auto-reply)";

        $mail->Body = $thankyou_html_body;
        $mail->AltBody = $thankyou_txt_body;

        $mail->send();

      } catch (Exception $e) {
        header("Location:/contact-form-error/?p=" . urlencode($mail->ErrorInfo));
        exit;
      }

      header("Location:/thankyou-for-contacting-floriade/");
      exit();

    } else {
      header("Location:/contact-form-error/?p=" . urlencode("reCaptcha failed to verify your response"));
      exit;
    }
  } elseif($responseKeys["error-codes"]) {
    header("Location:/contact-form-error/?p=" . urlencode(json_encode($responseKeys["error-codes"], JSON_PRETTY_PRINT)));
    exit;
  }
}

?>
