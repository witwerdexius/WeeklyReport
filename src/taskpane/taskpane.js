Office.onReady((info) => {
    if (info.host === Office.HostType.Outlook) {
        document.getElementById("createEmail").onclick = createEmailWithAppointments;
    }
});

function createEmailWithAppointments() {
    const mailbox = Office.context.mailbox;
    const now = new Date();

    // Start der Woche (Montag)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);

    // Ende der Woche (Sonntag)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    // Abrufen der Termine der Woche
    const startTime = startOfWeek.toISOString();
    const endTime = endOfWeek.toISOString();

    mailbox.getCallbackTokenAsync({ isRest: true }, (result) => {
        if (result.status === Office.AsyncResultStatus.Succeeded) {
            const token = result.value;
            const url = `${mailbox.restUrl}/v1.0/me/calendarView?startDateTime=${startTime}&endDateTime=${endTime}`;

            fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json"
                }
            })
                .then(response => response.json())
                .then(data => {
                    const appointments = data.value;
                    const emailBody = appointments.map(appointment => {
                        const duration = calculateDuration(appointment.Start, appointment.End);
                        return `- ${appointment.Subject}: ${duration}`;
                    }).join("<br>");

                    createNewEmail(emailBody);
                })
                .catch(error => console.error("Fehler beim Abrufen der Termine: ", error));
        } else {
            console.error("Fehler beim Abrufen des Tokens: ", result.error.message);
        }
    });
}

function calculateDuration(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const durationInMinutes = (endDate - startDate) / 60000;
    const hours = Math.floor(durationInMinutes / 60);
    const minutes = durationInMinutes % 60;
    return `${hours} Stunden ${minutes} Minuten`;
}

function createNewEmail(body) {
    Office.context.mailbox.displayNewMessageForm({
        to: "",
        subject: "Termine der aktuellen Woche",
        body: {
            contentType: "HTML",
            content: body
        }
    });
}
