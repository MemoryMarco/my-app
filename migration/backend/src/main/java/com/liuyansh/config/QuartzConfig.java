package com.liuyansh.config;
import com.liuyansh.service.EmailService;
import org.quartz.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
@Configuration
public class QuartzConfig {
    public static class EmailJob implements Job {
        private final EmailService emailService;
        public EmailJob(EmailService emailService) {
            this.emailService = emailService;
        }
        @Override
        public void execute(JobExecutionContext context) {
            emailService.sendWeeklyEmail();
        }
    }
    @Bean
    public JobDetail emailJobDetail() {
        return JobBuilder.newJob(EmailJob.class)
                .withIdentity("emailJob")
                .storeDurably()
                .build();
    }
    @Bean
    public Trigger emailJobTrigger() {
        return TriggerBuilder.newTrigger()
                .forJob(emailJobDetail())
                .withIdentity("emailTrigger")
                .withSchedule(CronScheduleBuilder.cronSchedule("0 0 20 ? * MON-FRI")) // Mon-Fri at 8 PM
                .build();
    }
}