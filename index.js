const fs = require('fs');
const path = require('path');
const moment = require('moment');

const data = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'trainings.txt'), 'utf-8'));

function getTrainingCounts(data) {
    const trainingCounts = {};
    data.forEach(person => {
        person.completions.forEach(completion => {
            const name = completion.name;
            if (!trainingCounts[name]) {
                trainingCounts[name] = 0;
            }
            if (completion.timestamp) {
                trainingCounts[name]++;
            }
        });
    });
    return trainingCounts;
}

function getPeopleForTrainings(data, trainings, fiscalYear) {
    const startOfYear = moment(`${fiscalYear - 1}-07-01`);
    const endOfYear = moment(`${fiscalYear}-06-30`);
    const result = {};

    trainings.forEach(trainingName => {
        result[trainingName] = [];
        data.forEach(person => {
            person.completions.forEach(completion => {
                if (completion.name === trainingName) {
                    const completionDate = moment(completion.timestamp, 'M/D/YYYY');
                    if (completionDate.isBetween(startOfYear, endOfYear)) {
                        result[trainingName].push({
                            person: person.name,
                            completedOn: completion.timestamp
                        });
                    }
                }
            });
        });
    });

    return result;
}

function getExpiringOrExpired(data, referenceDate) {
    const result = [];
    const refDate = moment(referenceDate);
    const oneMonthLater = moment(referenceDate).add(1, 'month');

    data.forEach(person => {
        person.completions.forEach(completion => {
            if (completion.expires) {
                const expirationDate = moment(completion.expires, 'M/D/YYYY');
                if (expirationDate.isBefore(refDate)) {
                    result.push({
                        name: person.name,
                        training: completion.name,
                        status: 'expired',
                        expirationDate: completion.expires
                    });
                } else if (expirationDate.isBetween(refDate, oneMonthLater)) {
                    result.push({
                        name: person.name,
                        training: completion.name,
                        status: 'expires soon',
                        expirationDate: completion.expires
                    });
                }
            }
        });
    });

    return result;
}

const completedTrainings = getTrainingCounts(data);
fs.writeFileSync('completed_trainings.json', JSON.stringify(completedTrainings, null, 2));

const trainings = ["Electrical Safety for Labs", "X-Ray Safety", "Laboratory Safety Training"];
const fiscalYear = 2024;
const completedInFiscalYear = getPeopleForTrainings(data, trainings, fiscalYear);
fs.writeFileSync('completed_in_fiscal_year.json', JSON.stringify(completedInFiscalYear, null, 2));

const referenceDate = '2023-10-01';
const expiringOrExpiredTrainings = getExpiringOrExpired(data, referenceDate);
fs.writeFileSync('expiring_or_expired.json', JSON.stringify(expiringOrExpiredTrainings, null, 2));

console.log('Output generated: completed_trainings.json, completed_in_fiscal_year.json, expiring_or_expired.json');
