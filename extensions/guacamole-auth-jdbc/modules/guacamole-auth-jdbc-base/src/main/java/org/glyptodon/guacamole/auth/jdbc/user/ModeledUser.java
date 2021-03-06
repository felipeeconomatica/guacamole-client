/*
 * Copyright (C) 2015 Glyptodon LLC
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

package org.glyptodon.guacamole.auth.jdbc.user;

import com.google.inject.Inject;
import java.sql.Date;
import java.sql.Time;
import java.text.ParseException;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.TimeZone;
import org.glyptodon.guacamole.auth.jdbc.base.ModeledDirectoryObject;
import org.glyptodon.guacamole.auth.jdbc.security.PasswordEncryptionService;
import org.glyptodon.guacamole.auth.jdbc.security.SaltService;
import org.glyptodon.guacamole.auth.jdbc.permission.SystemPermissionService;
import org.glyptodon.guacamole.GuacamoleException;
import org.glyptodon.guacamole.auth.jdbc.activeconnection.ActiveConnectionPermissionService;
import org.glyptodon.guacamole.auth.jdbc.permission.ConnectionGroupPermissionService;
import org.glyptodon.guacamole.auth.jdbc.permission.ConnectionPermissionService;
import org.glyptodon.guacamole.auth.jdbc.permission.UserPermissionService;
import org.glyptodon.guacamole.form.BooleanField;
import org.glyptodon.guacamole.form.DateField;
import org.glyptodon.guacamole.form.Field;
import org.glyptodon.guacamole.form.Form;
import org.glyptodon.guacamole.form.TimeField;
import org.glyptodon.guacamole.form.TimeZoneField;
import org.glyptodon.guacamole.net.auth.User;
import org.glyptodon.guacamole.net.auth.permission.ObjectPermissionSet;
import org.glyptodon.guacamole.net.auth.permission.SystemPermission;
import org.glyptodon.guacamole.net.auth.permission.SystemPermissionSet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * An implementation of the User object which is backed by a database model.
 *
 * @author James Muehlner
 * @author Michael Jumper
 */
public class ModeledUser extends ModeledDirectoryObject<UserModel> implements User {

    /**
     * Logger for this class.
     */
    private static final Logger logger = LoggerFactory.getLogger(ModeledUser.class);

    /**
     * The name of the attribute which controls whether a user account is
     * disabled.
     */
    public static final String DISABLED_ATTRIBUTE_NAME = "disabled";

    /**
     * The name of the attribute which controls whether a user's password is
     * expired and must be reset upon login.
     */
    public static final String EXPIRED_ATTRIBUTE_NAME = "expired";

    /**
     * The name of the attribute which controls the time of day after which a
     * user may login.
     */
    public static final String ACCESS_WINDOW_START_ATTRIBUTE_NAME = "access-window-start";

    /**
     * The name of the attribute which controls the time of day after which a
     * user may NOT login.
     */
    public static final String ACCESS_WINDOW_END_ATTRIBUTE_NAME = "access-window-end";

    /**
     * The name of the attribute which controls the date after which a user's
     * account is valid.
     */
    public static final String VALID_FROM_ATTRIBUTE_NAME = "valid-from";

    /**
     * The name of the attribute which controls the date after which a user's
     * account is no longer valid.
     */
    public static final String VALID_UNTIL_ATTRIBUTE_NAME = "valid-until";

    /**
     * The name of the attribute which defines the time zone used for all
     * time and date attributes related to this user.
     */
    public static final String TIMEZONE_ATTRIBUTE_NAME = "timezone";

    /**
     * All attributes related to restricting user accounts, within a logical
     * form.
     */
    public static final Form ACCOUNT_RESTRICTIONS = new Form("restrictions", Arrays.<Field>asList(
        new BooleanField(DISABLED_ATTRIBUTE_NAME, "true"),
        new BooleanField(EXPIRED_ATTRIBUTE_NAME, "true"),
        new TimeField(ACCESS_WINDOW_START_ATTRIBUTE_NAME),
        new TimeField(ACCESS_WINDOW_END_ATTRIBUTE_NAME),
        new DateField(VALID_FROM_ATTRIBUTE_NAME),
        new DateField(VALID_UNTIL_ATTRIBUTE_NAME),
        new TimeZoneField(TIMEZONE_ATTRIBUTE_NAME)
    ));

    /**
     * All possible attributes of user objects organized as individual,
     * logical forms.
     */
    public static final Collection<Form> ATTRIBUTES = Collections.unmodifiableCollection(Arrays.asList(
        ACCOUNT_RESTRICTIONS
    ));

    /**
     * Service for hashing passwords.
     */
    @Inject
    private PasswordEncryptionService encryptionService;

    /**
     * Service for providing secure, random salts.
     */
    @Inject
    private SaltService saltService;

    /**
     * Service for retrieving system permissions.
     */
    @Inject
    private SystemPermissionService systemPermissionService;

    /**
     * Service for retrieving connection permissions.
     */
    @Inject
    private ConnectionPermissionService connectionPermissionService;

    /**
     * Service for retrieving connection group permissions.
     */
    @Inject
    private ConnectionGroupPermissionService connectionGroupPermissionService;

    /**
     * Service for retrieving active connection permissions.
     */
    @Inject
    private ActiveConnectionPermissionService activeConnectionPermissionService;

    /**
     * Service for retrieving user permissions.
     */
    @Inject
    private UserPermissionService userPermissionService;

    /**
     * The plaintext password previously set by a call to setPassword(), if
     * any. The password of a user cannot be retrieved once saved into the
     * database, so this serves to ensure getPassword() returns a reasonable
     * value if setPassword() is called. If no password has been set, or the
     * user was retrieved from the database, this will be null.
     */
    private String password = null;
    
    /**
     * Creates a new, empty ModeledUser.
     */
    public ModeledUser() {
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public void setPassword(String password) {

        UserModel userModel = getModel();
        
        // Store plaintext password internally
        this.password = password;

        // If no password provided, clear password salt and hash
        if (password == null) {
            userModel.setPasswordSalt(null);
            userModel.setPasswordHash(null);
        }

        // Otherwise generate new salt and hash given password using newly-generated salt
        else {
            byte[] salt = saltService.generateSalt();
            byte[] hash = encryptionService.createPasswordHash(password, salt);

            // Set stored salt and hash
            userModel.setPasswordSalt(salt);
            userModel.setPasswordHash(hash);
        }

    }

    /**
     * Returns whether this user is a system administrator, and thus is not
     * restricted by permissions.
     *
     * @return
     *    true if this user is a system administrator, false otherwise.
     *
     * @throws GuacamoleException 
     *    If an error occurs while determining the user's system administrator
     *    status.
     */
    public boolean isAdministrator() throws GuacamoleException {
        SystemPermissionSet systemPermissionSet = getSystemPermissions();
        return systemPermissionSet.hasPermission(SystemPermission.Type.ADMINISTER);
    }
    
    @Override
    public SystemPermissionSet getSystemPermissions()
            throws GuacamoleException {
        return systemPermissionService.getPermissionSet(getCurrentUser(), this);
    }

    @Override
    public ObjectPermissionSet getConnectionPermissions()
            throws GuacamoleException {
        return connectionPermissionService.getPermissionSet(getCurrentUser(), this);
    }

    @Override
    public ObjectPermissionSet getConnectionGroupPermissions()
            throws GuacamoleException {
        return connectionGroupPermissionService.getPermissionSet(getCurrentUser(), this);
    }

    @Override
    public ObjectPermissionSet getActiveConnectionPermissions()
            throws GuacamoleException {
        return activeConnectionPermissionService.getPermissionSet(getCurrentUser(), this);
    }

    @Override
    public ObjectPermissionSet getUserPermissions()
            throws GuacamoleException {
        return userPermissionService.getPermissionSet(getCurrentUser(), this);
    }

    @Override
    public Map<String, String> getAttributes() {

        Map<String, String> attributes = new HashMap<String, String>();

        // Set disabled attribute
        attributes.put(DISABLED_ATTRIBUTE_NAME, getModel().isDisabled() ? "true" : null);

        // Set password expired attribute
        attributes.put(EXPIRED_ATTRIBUTE_NAME, getModel().isExpired() ? "true" : null);

        // Set access window start time
        attributes.put(ACCESS_WINDOW_START_ATTRIBUTE_NAME, TimeField.format(getModel().getAccessWindowStart()));

        // Set access window end time
        attributes.put(ACCESS_WINDOW_END_ATTRIBUTE_NAME, TimeField.format(getModel().getAccessWindowEnd()));

        // Set account validity start date
        attributes.put(VALID_FROM_ATTRIBUTE_NAME, DateField.format(getModel().getValidFrom()));

        // Set account validity end date
        attributes.put(VALID_UNTIL_ATTRIBUTE_NAME, DateField.format(getModel().getValidUntil()));

        // Set timezone attribute
        attributes.put(TIMEZONE_ATTRIBUTE_NAME, getModel().getTimeZone());

        return attributes;
    }

    /**
     * Parses the given string into a corresponding date. The string must
     * follow the standard format used by date attributes, as defined by
     * DateField.FORMAT and as would be produced by DateField.format().
     *
     * @param dateString
     *     The date string to parse, which may be null.
     *
     * @return
     *     The date corresponding to the given date string, or null if the
     *     provided date string was null or blank.
     *
     * @throws ParseException
     *     If the given date string does not conform to the standard format
     *     used by date attributes.
     */
    private Date parseDate(String dateString)
    throws ParseException {

        // Return null if no date provided
        java.util.Date parsedDate = DateField.parse(dateString);
        if (parsedDate == null)
            return null;

        // Convert to SQL Date
        return new Date(parsedDate.getTime());

    }

    /**
     * Parses the given string into a corresponding time. The string must
     * follow the standard format used by time attributes, as defined by
     * TimeField.FORMAT and as would be produced by TimeField.format().
     *
     * @param timeString
     *     The time string to parse, which may be null.
     *
     * @return
     *     The time corresponding to the given time string, or null if the
     *     provided time string was null or blank.
     *
     * @throws ParseException
     *     If the given time string does not conform to the standard format
     *     used by time attributes.
     */
    private Time parseTime(String timeString)
    throws ParseException {

        // Return null if no time provided
        java.util.Date parsedDate = TimeField.parse(timeString);
        if (parsedDate == null)
            return null;

        // Convert to SQL Time 
        return new Time(parsedDate.getTime());

    }

    @Override
    public void setAttributes(Map<String, String> attributes) {

        // Translate disabled attribute
        getModel().setDisabled("true".equals(attributes.get(DISABLED_ATTRIBUTE_NAME)));

        // Translate password expired attribute
        getModel().setExpired("true".equals(attributes.get(EXPIRED_ATTRIBUTE_NAME)));

        // Translate access window start time
        try { getModel().setAccessWindowStart(parseTime(attributes.get(ACCESS_WINDOW_START_ATTRIBUTE_NAME))); }
        catch (ParseException e) {
            logger.warn("Not setting start time of user access window: {}", e.getMessage());
            logger.debug("Unable to parse time attribute.", e);
        }

        // Translate access window end time
        try { getModel().setAccessWindowEnd(parseTime(attributes.get(ACCESS_WINDOW_END_ATTRIBUTE_NAME))); }
        catch (ParseException e) {
            logger.warn("Not setting end time of user access window: {}", e.getMessage());
            logger.debug("Unable to parse time attribute.", e);
        }

        // Translate account validity start date
        try { getModel().setValidFrom(parseDate(attributes.get(VALID_FROM_ATTRIBUTE_NAME))); }
        catch (ParseException e) {
            logger.warn("Not setting user validity start date: {}", e.getMessage());
            logger.debug("Unable to parse date attribute.", e);
        }

        // Translate account validity end date
        try { getModel().setValidUntil(parseDate(attributes.get(VALID_UNTIL_ATTRIBUTE_NAME))); }
        catch (ParseException e) {
            logger.warn("Not setting user validity end date: {}", e.getMessage());
            logger.debug("Unable to parse date attribute.", e);
        }

        // Translate timezone attribute
        getModel().setTimeZone(TimeZoneField.parse(attributes.get(TIMEZONE_ATTRIBUTE_NAME)));

    }

    /**
     * Returns the time zone associated with this user. This time zone must be
     * used when interpreting all date/time restrictions related to this user.
     *
     * @return
     *     The time zone associated with this user.
     */
    private TimeZone getTimeZone() {

        // If no time zone is set, use the default
        String timeZone = getModel().getTimeZone();
        if (timeZone == null)
            return TimeZone.getDefault();

        // Otherwise parse and return time zone
        return TimeZone.getTimeZone(timeZone);

    }

    /**
     * Converts a SQL Time to a Calendar, independently of time zone, using the
     * given Calendar as a base. The time components will be copied to the
     * given Calendar verbatim, leaving the date and time zone components of
     * the given Calendar otherwise intact.
     *
     * @param base
     *     The Calendar object to use as a base for the conversion.
     *
     * @param time
     *     The SQL Time object containing the time components to be applied to
     *     the given Calendar.
     *
     * @return
     *     The given Calendar, now modified to represent the given time.
     */
    private Calendar asCalendar(Calendar base, Time time) {

        // Get calendar from given SQL time
        Calendar timeCalendar = Calendar.getInstance();
        timeCalendar.setTime(time);

        // Apply given time to base calendar
        base.set(Calendar.HOUR_OF_DAY, timeCalendar.get(Calendar.HOUR_OF_DAY));
        base.set(Calendar.MINUTE,      timeCalendar.get(Calendar.MINUTE));
        base.set(Calendar.SECOND,      timeCalendar.get(Calendar.SECOND));
        base.set(Calendar.MILLISECOND, timeCalendar.get(Calendar.MILLISECOND));

        return base;
        
    }

    /**
     * Returns the time during the current day when this user account can start
     * being used.
     *
     * @return
     *     The time during the current day when this user account can start
     *     being used.
     */
    private Calendar getAccessWindowStart() {

        // Get window start time
        Time start = getModel().getAccessWindowStart();
        if (start == null)
            return null;

        // Return within defined time zone, current day
        return asCalendar(Calendar.getInstance(getTimeZone()), start);

    }

    /**
     * Returns the time during the current day when this user account can no
     * longer be used.
     *
     * @return
     *     The time during the current day when this user account can no longer
     *     be used.
     */
    private Calendar getAccessWindowEnd() {

        // Get window end time
        Time end = getModel().getAccessWindowEnd();
        if (end == null)
            return null;

        // Return within defined time zone, current day
        return asCalendar(Calendar.getInstance(getTimeZone()), end);

    }

    /**
     * Returns the date after which this account becomes valid. The time
     * components of the resulting Calendar object will be set to midnight of
     * the date in question.
     *
     * @return
     *     The date after which this account becomes valid.
     */
    private Calendar getValidFrom() {

        // Get valid from date
        Date validFrom = getModel().getValidFrom();
        if (validFrom == null)
            return null;

        // Convert to midnight within defined time zone
        Calendar validFromCalendar = Calendar.getInstance(getTimeZone());
        validFromCalendar.setTime(validFrom);
        validFromCalendar.set(Calendar.HOUR_OF_DAY, 0);
        validFromCalendar.set(Calendar.MINUTE,      0);
        validFromCalendar.set(Calendar.SECOND,      0);
        validFromCalendar.set(Calendar.MILLISECOND, 0);
        return validFromCalendar;

    }

    /**
     * Returns the date after which this account becomes invalid. The time
     * components of the resulting Calendar object will be set to the last
     * millisecond of the day in question (23:59:59.999).
     *
     * @return
     *     The date after which this account becomes invalid.
     */
    private Calendar getValidUntil() {

        // Get valid until date
        Date validUntil = getModel().getValidUntil();
        if (validUntil == null)
            return null;

        // Convert to end-of-day within defined time zone
        Calendar validUntilCalendar = Calendar.getInstance(getTimeZone());
        validUntilCalendar.setTime(validUntil);
        validUntilCalendar.set(Calendar.HOUR_OF_DAY,  23);
        validUntilCalendar.set(Calendar.MINUTE,       59);
        validUntilCalendar.set(Calendar.SECOND,       59);
        validUntilCalendar.set(Calendar.MILLISECOND, 999);
        return validUntilCalendar;

    }

    /**
     * Given a time when a particular state changes from inactive to active,
     * and a time when a particular state changes from active to inactive,
     * determines whether that state is currently active.
     *
     * @param activeStart
     *     The time at which the state changes from inactive to active.
     *
     * @param inactiveStart
     *     The time at which the state changes from active to inactive.
     *
     * @return
     *     true if the state is currently active, false otherwise.
     */
    private boolean isActive(Calendar activeStart, Calendar inactiveStart) {

        // If end occurs before start, convert to equivalent case where start
        // start is before end
        if (inactiveStart != null && activeStart != null && inactiveStart.before(activeStart))
            return !isActive(inactiveStart, activeStart);

        // Get current time
        Calendar current = Calendar.getInstance();

        // State is active iff the current time is between the start and end
        return !(activeStart != null && current.before(activeStart))
            && !(inactiveStart != null && current.after(inactiveStart));

    }

    /**
     * Returns whether this user account is currently valid as of today.
     * Account validity depends on optional date-driven restrictions which
     * define when an account becomes valid, and when an account ceases being
     * valid.
     *
     * @return
     *     true if the account is valid as of today, false otherwise.
     */
    public boolean isAccountValid() {
        return isActive(getValidFrom(), getValidUntil());
    }

    /**
     * Returns whether the current time is within this user's allowed access
     * window. If the login times for this user are not limited, this will
     * return true.
     *
     * @return
     *     true if the current time is within this user's allowed access
     *     window, or if this user has no restrictions on login time, false
     *     otherwise.
     */
    public boolean isAccountAccessible() {
        return isActive(getAccessWindowStart(), getAccessWindowEnd());
    }

}
