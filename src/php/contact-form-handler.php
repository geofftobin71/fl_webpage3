<?php
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");

require_once "dotenv.php";
require_once "mail-config.php";

// $recaptcha_secret = getenv("RECAPTCHA_SECRET_KEY");

function clean($data) {
  $data = trim($data);
  $data = stripslashes($data);
  $data = htmlspecialchars($data);
  return $data;
}

$input = file_get_contents('php://input');
$body = json_decode($input, true);

if($_SERVER['REQUEST_METHOD'] !== 'POST' || json_last_error() !== JSON_ERROR_NONE) {
  http_response_code(400);
  $error = ["error" => "Bad Request"];
  echo json_encode($error);
  exit;
}

$name = clean($body["name"]);
$phone = clean($body["phone"]);
$email_address = clean($body["email"]);
$subject = clean($body["subject"]);
$message = clean($body["message"]);
$email_heading = clean($body["heading"]);

$first_name = explode(" ", $name)[0];

$thankyou_html_template = file_get_contents("email/contact-thankyou.html");
$thankyou_txt_template = file_get_contents("email/contact-thankyou.txt");
$message_html_template = file_get_contents("email/contact-message.html");
$message_txt_template = file_get_contents("email/contact-message.txt");
$spam_html_template = file_get_contents("email/contact-spam.html");
$spam_txt_template = file_get_contents("email/contact-spam.txt");

$placeholders = [
  "%name%",
  "%phone%",
  "%email%",
  "%firstname%",
  "%message%",
  "%email_heading%",
];

$values = [
  $name,
  $phone,
  $email_address,
  $first_name,
  $message,
  $email_heading,
];

$thankyou_html_body = str_replace($placeholders, $values, $thankyou_html_template);
$thankyou_txt_body = str_replace($placeholders, $values, $thankyou_txt_template);
$message_html_body = str_replace($placeholders, $values, $message_html_template);
$message_txt_body = str_replace($placeholders, $values, $message_txt_template);
$spam_html_body = str_replace($placeholders, $values, $spam_html_template);
$spam_txt_body = str_replace($placeholders, $values, $spam_txt_template);

// ========== reCaptcha ==========

  /*
$g_recaptcha_response = $body["g-recaptcha-response"];
$remote_ip = $_SERVER["REMOTE_ADDR"];
$url = "https://www.google.com/recaptcha/api/siteverify?secret=" . urlencode($recaptcha_secret) . "&response=" . urlencode($g_recaptcha_response) . "&remoteip=" . urlencode($remote_ip);

  $options = ["http" => ["method" => "POST"]];
  $stream = stream_context_create($options);
  $response = file_get_contents($url, false, $stream);
  $responseKeys = json_decode($response, true);

  if($responseKeys["success"] && $responseKeys["action"] == "contactform") {
    if($responseKeys["score"] >= 0.5) {
   */

// ========== Contact Form Email ==========

if(!empty($phone)) {

  try {
    $mail->clearAddresses();
    $mail->setFrom("noreply@floriade.co.nz", "Floriade");
    $mail->addAddress($floriade_email, "Floriade");
    $mail->addReplyTo($email_address, $name);
    $mail->Subject = "Possible Robot : " . $subject;

    $mail->Body = $spam_html_body;
    $mail->AltBody = $spam_txt_body;

    $mail->send();

  } catch (Exception $e) {
    http_response_code(500);
    $error = ["error" => $mail->ErrorInfo];
    echo json_encode($error);
    exit;
  }

} else {

  try {
    $mail->clearAddresses();
    $mail->addAddress($floriade_email, "Floriade");
    $mail->setFrom("noreply@floriade.co.nz", "Floriade");
    $mail->addReplyTo($email_address, $name);
    $mail->Subject = $subject;

    $mail->Body = $message_html_body;
    $mail->AltBody = $message_txt_body;

    $mail->send();

  } catch (Exception $e) {
    http_response_code(500);
    $error = ["error" => $mail->ErrorInfo];
    echo json_encode($error);
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
    http_response_code(500);
    $error = ["error" => $mail->ErrorInfo];
    echo json_encode($error);
    exit;
  }
}

$info = ["message" => "Mail Sent"];
echo json_encode($info);
exit;

      /*
    } else {
      http_response_code(500);
      $error = ["error" => "reCaptcha failed to verify your response"];
      echo json_encode($error);
      exit;
    }
  } elseif($responseKeys["error-codes"]) {
    http_response_code(500);
    $error = ["error" => "reCaptcha: " . json_encode($responseKeys["error-codes"])];
    echo json_encode($error);
    exit;
  }
       */

?>
